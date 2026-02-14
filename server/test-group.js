const fs = require('fs');

async function testGroupPhoto() {
  // Step 1: Get upload URL
  console.log('Step 1: Getting upload URL...');
  const urlRes = await fetch('http://localhost:5000/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'group.jpg',
      fileType: 'image/jpeg',
      uploaderId: 'austin',
    }),
  });
  const urlData = await urlRes.json();
  console.log('Got s3Key:', urlData.s3Key);

  // Step 2: Upload group photo to S3
  console.log('Step 2: Uploading group photo to S3...');
  const photoPath = './test-group.jpg';  // PUT YOUR GROUP PHOTO HERE
  const fileBuffer = fs.readFileSync(photoPath);

  const uploadRes = await fetch(urlData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: fileBuffer,
  });
  console.log('Upload status:', uploadRes.status);

  // Step 3: Process photo - find faces!
  console.log('Step 3: Scanning for faces...');
  const processRes = await fetch('http://localhost:5000/photo-processed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      s3Key: urlData.s3Key,
      photoId: urlData.photoId,
    }),
  });
  const processData = await processRes.json();
  console.log('Matches found:', processData.matches);

  // Step 4: Check gallery
  console.log('Step 4: Checking Austin gallery...');
  const galleryRes = await fetch('http://localhost:5000/my-photos?userId=austin');
  const galleryData = await galleryRes.json();
  console.log('Photos in gallery:', galleryData.photos);
}

testGroupPhoto().catch(console.error);