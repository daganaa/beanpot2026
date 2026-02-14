const fs = require('fs');

async function testFlow() {
  // Step 1: Get upload URL
  console.log('Step 1: Getting upload URL...');
  const urlRes = await fetch('http://localhost:5000/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'selfie.jpg',
      fileType: 'image/jpeg',
      uploaderId: 'austin',
    }),
  });
  const urlData = await urlRes.json();
  console.log('Got URL and s3Key:', urlData.s3Key);

  // Step 2: Upload photo to S3
  console.log('Step 2: Uploading photo to S3...');
  const photoPath = './test-selfie.jpg';  // PUT YOUR PHOTO HERE
  const fileBuffer = fs.readFileSync(photoPath);
  
  const uploadRes = await fetch(urlData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: fileBuffer,
  });
  console.log('Upload status:', uploadRes.status);

  // Step 3: Enroll face
  console.log('Step 3: Enrolling face...');
  const enrollRes = await fetch('http://localhost:5000/enroll-face', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      s3Key: urlData.s3Key,
      userId: 'austin',
      name: 'Austin',
    }),
  });
  const enrollData = await enrollRes.json();
  console.log('Enroll result:', enrollData);
}

testFlow().catch(console.error);