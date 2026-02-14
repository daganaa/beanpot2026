const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Import the AWS tools we need
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { RekognitionClient, IndexFacesCommand, SearchFacesByImageCommand } = require('@aws-sdk/client-rekognition');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
app.use(cors());
app.use(express.json());

// Create an S3 "connection" using your .env credentials
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Health check route (our original one)
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});
// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    res.json({ message: 'Database connected!', users: data });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});
app.post('/enroll-face', async (req, res) => {
  try {
    const { s3Key, userId, name } = req.body;

    // Create or update user in database
    const { error: userError } = await supabase
      .from('users')
      .upsert({ id: userId, name: name, face_enrolled: true });

    if (userError) throw userError;

    const command = new IndexFacesCommand({
      CollectionId: 'beanpot2026-faces',
      Image: {
        S3Object: {
          Bucket: process.env.S3_BUCKET_NAME,
          Name: s3Key,
        },
      },
      ExternalImageId: userId,
      MaxFaces: 1,
      DetectionAttributes: ['DEFAULT'],
    });

    const response = await rekognition.send(command);

    if (response.FaceRecords.length === 0) {
      return res.status(400).json({ error: 'No face detected in image' });
    }

    res.json({
      message: 'Face enrolled successfully',
      faceId: response.FaceRecords[0].Face.FaceId,
    });
  } catch (error) {
    console.error('Error enrolling face:', error);
    res.status(500).json({ error: 'Failed to enroll face' });
  }
});

// NEW: Generate a presigned URL for uploading
app.post('/upload-url', async (req, res) => {
  try {
    const { fileName, fileType, uploaderId } = req.body;
    
    const s3Key = `photos/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    // Save photo record to database
    const { data, error } = await supabase
      .from('photos')
      .insert({ s3_key: s3Key, uploader_id: uploaderId })
      .select()
      .single();

    if (error) throw error;

    res.json({ uploadUrl, photoId: data.id, s3Key });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

app.post('/photo-processed', async (req, res) => {
  try {
    const { s3Key, photoId } = req.body;

    const command = new SearchFacesByImageCommand({
      CollectionId: 'beanpot2026-faces',
      Image: {
        S3Object: {
          Bucket: process.env.S3_BUCKET_NAME,
          Name: s3Key,
        },
      },
      FaceMatchThreshold: 90,
      MaxFaces: 10,
    });

    const response = await rekognition.send(command);

    const matches = response.FaceMatches.map((match) => ({
      photo_id: photoId,
      user_id: match.Face.ExternalImageId,
      confidence: match.Face.Confidence,
    }));

    // Save all matches to the database
    if (matches.length > 0) {
      const { error } = await supabase
        .from('photo_users')
        .insert(matches);

      if (error) throw error;
    }

    res.json({ matches });
  } catch (error) {
    console.error('Error processing photo:', error);
    res.status(500).json({ error: 'Failed to process photo' });
  }
});
// Get all photos the user appears in
app.get('/my-photos', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('photo_users')
      .select('photo_id, confidence, photos(s3_key, created_at)')
      .eq('user_id', userId)
      .eq('hidden', false);

    if (error) throw error;

    res.json({ photos: data });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Hide a photo from user's gallery
app.post('/hide-photo', async (req, res) => {
  try {
    const { photoId, userId } = req.body;

    const { error } = await supabase
      .from('photo_users')
      .update({ hidden: true })
      .eq('photo_id', photoId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Photo hidden' });
  } catch (error) {
    console.error('Error hiding photo:', error);
    res.status(500).json({ error: 'Failed to hide photo' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});