import { rekognitionClient, BUCKET_NAME } from './aws';
import { IndexFacesCommand, SearchFacesByImageCommand, CreateCollectionCommand } from '@aws-sdk/client-rekognition';

const COLLECTION_ID = 'beanpot_faces';

// Helper to ensure collection exists (lazy init)
async function ensureCollection() {
    try {
        await rekognitionClient.send(new CreateCollectionCommand({ CollectionId: COLLECTION_ID }));
        console.log(`Collection ${COLLECTION_ID} created.`);
    } catch (e: any) {
        if (e.name !== 'ResourceAlreadyExistsException') {
            console.error('Error ensuring collection:', e);
            throw e;
        }
    }
}

export async function indexReferenceFace(userId: string, s3Key: string) {
    await ensureCollection();

    const command = new IndexFacesCommand({
        CollectionId: COLLECTION_ID,
        Image: {
            S3Object: {
                Bucket: BUCKET_NAME,
                Name: s3Key,
            },
        },
        ExternalImageId: userId, // We use the User ID as the identifier
        DetectionAttributes: ['DEFAULT'],
        MaxFaces: 1, // Reference photo should have only 1 face
    });

    const response = await rekognitionClient.send(command);

    if (!response.FaceRecords || response.FaceRecords.length === 0) {
        throw new Error('No face detected in reference photo');
    }

    return response.FaceRecords[0].Face?.FaceId;
}

export async function processEventPhoto(photoId: string, s3Key: string) {
    await ensureCollection();

    // 1. Detect faces and search for them in the collection
    const command = new SearchFacesByImageCommand({
        CollectionId: COLLECTION_ID,
        Image: {
            S3Object: {
                Bucket: BUCKET_NAME,
                Name: s3Key,
            },
        },
        FaceMatchThreshold: 80, // Confidence threshold
    });

    try {
        const response = await rekognitionClient.send(command);
        const matches: { userId: string, confidence: number }[] = [];

        // Response contains FaceMatches. Note: SearchFacesByImage detects the *largest* face and searches for it.
        // Wait, SearchFacesByImage only searches for the *largest* face or creates a search.
        // Actually, for an event photo with MULTIPLE people, we want to IndexFaces first to find all face locations?
        // No, standard pattern:
        // Option A: IndexFaces (adds all faces to collection) -> Then specific Search.
        // Option B: We want to find *known users* in this photo.

        // Correct approach for "Event Photo":
        // 1. Call IndexFaces on the event photo to detect ALL faces. 
        //    We don't necessarily want to *save* these faces to the collection if they are just random guests, 
        //    BUT we need their embeddings to match against known users?
        //    Actually, Rekognition "SearchFacesByImage" is limited (one face).

        // Better Approach for Group Photos:
        // 1. DetectFaces (get bounding boxes). 
        // 2. For each face, crop? No, expensive.

        // BEST Approach (Batch):
        // 1. Call IndexFaces on the event photo. This adds ALL faces in the photo to the specific Collection.
        //    It returns the FaceRecords for everyone found.
        //    BUT this pollutes the collection with random people if we aren't careful.
        //    However, if we use the User's ID as ExternalImageId only for REFERENCE photos, then generic faces have no ID.

        // Wait, we want to find if User X is in Photo Y.
        // User X is in the collection (Selfie).
        // Photo Y comes in.
        // We want to ask: "Are any faces in Photo Y matching anyone in the Collection?"
        // Rekognition API: `SearchFacesByImage`? No, "Detects the largest face in the image, and then searches the specified collection for matching faces." -> Only works if 1 person.

        // Working Reverse Approach:
        // 1. Index the Event Photo faces into the collection? 
        //    No, we want to search *against* the collection of Users.

        // Correct Flow for Multi-Face Search:
        // indexFaces() on the Uploaded Event Photo.
        // This gives us a list of `FaceRecords`.
        // For each `FaceRecord` detected (Person A, Person B...):
        //    Call `SearchFaces(FaceId)` against the Collection.
        //    This search finds if that new face matches any *existing* face in the collection.

        // But wait, if we index event photos, we are adding them to the collection.
        // That's actually fine/good. We build a graph.
        // But we need to know WHICH existing User it matches.
        // The "User Reference" faces have `ExternalImageId = UserId`.
        // So when we SearchFaces(EventFaceId), we look for matches that have an ExternalImageId.

        // So:
        // 1. IndexFaces(EventPhoto). Get list of new FaceIds.
        // 2. For each new FaceId:
        //    Result = SearchFaces(FaceId).
        //    Check matches. If a match has `ExternalImageId`, that's our User!

        return {
            process: async () => {
                const indexResponse = await rekognitionClient.send(new IndexFacesCommand({
                    CollectionId: COLLECTION_ID,
                    Image: { S3Object: { Bucket: BUCKET_NAME, Name: s3Key } },
                    DetectionAttributes: ['ALL']
                }));

                const foundUsers: { userId: string, confidence: number }[] = [];

                if (!indexResponse.FaceRecords) return [];

                // For each face found in the photo
                for (const record of indexResponse.FaceRecords) {
                    const faceId = record.Face?.FaceId;
                    if (!faceId) continue;

                    // Search for this face in the collection (to see if it matches a known User)
                    // We are searching *for* this face, *in* the collection.
                    // But we just Added it to the collection. So it will find itself.
                    // We need to ignore itself.

                    // Wait, SearchFaces searches for a FaceId *that already exists in the collection*.
                    // So this is perfect.

                    const searchResponse = await import('@aws-sdk/client-rekognition').then(mod =>
                        rekognitionClient.send(new mod.SearchFacesCommand({
                            CollectionId: COLLECTION_ID,
                            FaceId: faceId,
                            FaceMatchThreshold: 85,
                            MaxFaces: 5
                        }))
                    );

                    if (searchResponse.FaceMatches) {
                        for (const match of searchResponse.FaceMatches) {
                            // Check if the matched face is a Reference Photo (has ExternalImageId)
                            // Note: The Event Photo faces we just added DO NOT have ExternalImageId.
                            // The User Selfies DO have ExternalImageId.
                            // So if we match a face with ExternalImageId, we found a user.

                            // We need to fetch the ExternalImageId from the match?
                            // Rekognition SearchFaces returns Face object which has ExternalImageId.

                            if (match.Face && match.Face.ExternalImageId) {
                                foundUsers.push({
                                    userId: match.Face.ExternalImageId,
                                    confidence: match.Similarity || 0
                                });
                            }
                        }
                    }
                }
                return foundUsers;
            }
        }

    } catch (error) {
        console.error('Error processing event photo:', error);
        return { process: async () => [] };
    }
}
