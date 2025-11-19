import './input.css'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'
import { uploadFile, createVerificationSubmission, sendVerificationEmail } from './lib/api'

let currentPhotoType = null;
let stream = null;

// Global functions for onclick handlers
window.openFilePicker = function(type) {
  const fileInput = document.getElementById(`${type}-file`);
  fileInput.click();
};

window.openCamera = function(type) {
  currentPhotoType = type;
  const modal = document.getElementById('camera-modal');
  modal.classList.add('active');
  startCamera();
};

window.removePhoto = function(type) {
  const fileInput = document.getElementById(`${type}-file`);
  const dataInput = document.getElementById(`${type}-data`);
  const preview = document.getElementById(`${type}-preview`);
  const placeholder = document.getElementById(`${type}-placeholder`);
  const actions = document.getElementById(`${type}-actions`);
  const uploadArea = document.getElementById(`${type}-upload-area`);

  fileInput.value = '';
  dataInput.value = '';
  preview.classList.add('hidden');
  preview.src = '';
  placeholder.classList.remove('hidden');
  actions.classList.add('hidden');
  uploadArea.classList.remove('has-image');
};

// File input change handlers
document.getElementById('selfie-file').addEventListener('change', (e) => handleFileSelect(e, 'selfie'));
document.getElementById('id-front-file').addEventListener('change', (e) => handleFileSelect(e, 'id-front'));
document.getElementById('id-back-file').addEventListener('change', (e) => handleFileSelect(e, 'id-back'));

function handleFileSelect(event, type) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      displayPhoto(e.target.result, type);
    };
    reader.readAsDataURL(file);
  }
}

function displayPhoto(dataUrl, type) {
  const preview = document.getElementById(`${type}-preview`);
  const placeholder = document.getElementById(`${type}-placeholder`);
  const actions = document.getElementById(`${type}-actions`);
  const dataInput = document.getElementById(`${type}-data`);
  const uploadArea = document.getElementById(`${type}-upload-area`);

  preview.src = dataUrl;
  preview.classList.remove('hidden');
  placeholder.classList.add('hidden');
  actions.classList.remove('hidden');
  uploadArea.classList.add('has-image');
  dataInput.value = dataUrl;
}

function startCamera() {
  navigator.mediaDevices.getUserMedia({ 
    video: { 
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    } 
  })
  .then((mediaStream) => {
    stream = mediaStream;
    const video = document.getElementById('camera-video');
    video.srcObject = stream;
  })
  .catch((error) => {
    console.error('Error accessing camera:', error);
    alert('Unable to access camera. Please check your permissions or use the upload option instead.');
    closeCamera();
  });
}

function closeCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  const modal = document.getElementById('camera-modal');
  modal.classList.remove('active');
  const video = document.getElementById('camera-video');
  video.srcObject = null;
  currentPhotoType = null;
}

function capturePhoto() {
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  const context = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  displayPhoto(dataUrl, currentPhotoType);
  closeCamera();
}

// Camera modal controls
document.getElementById('capture-btn').addEventListener('click', capturePhoto);
document.getElementById('cancel-camera-btn').addEventListener('click', closeCamera);

// Form submission
document.getElementById('verification-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  
  // Validate form
  const ssn = document.getElementById('ssn').value.trim();
  const emailReference = document.getElementById('email_reference').value.trim();
  const selfieData = document.getElementById('selfie-data').value;
  const idFrontData = document.getElementById('id-front-data').value;
  const idBackData = document.getElementById('id-back-data').value;

  if (!ssn) {
    alert('Please enter your SSN');
    return;
  }

  if (!selfieData) {
    alert('Please upload or take a selfie photo');
    return;
  }

  if (!idFrontData) {
    alert('Please upload or take a photo of your ID card front');
    return;
  }

  if (!idBackData) {
    alert('Please upload or take a photo of your ID card back');
    return;
  }

  // Show loading state
  submitBtn.disabled = true;
  btnText.textContent = 'Uploading documents...';
  btnSpinner.classList.remove('hidden');

  try {
    // Generate unique file names with timestamp
    const timestamp = Date.now()
    const sanitizedSsn = ssn.replace(/[^a-zA-Z0-9]/g, '_')
    
    // Step 1: Upload images to Supabase Storage
    btnText.textContent = 'Uploading selfie...';
    const selfieUpload = await uploadFile(
      'verification-documents',
      `${sanitizedSsn}/${timestamp}_selfie.jpg`,
      selfieData
    )

    btnText.textContent = 'Uploading ID front...';
    const idFrontUpload = await uploadFile(
      'verification-documents',
      `${sanitizedSsn}/${timestamp}_id_front.jpg`,
      idFrontData
    )

    btnText.textContent = 'Uploading ID back...';
    const idBackUpload = await uploadFile(
      'verification-documents',
      `${sanitizedSsn}/${timestamp}_id_back.jpg`,
      idBackData
    )

    // Step 2: Create database record
    btnText.textContent = 'Saving verification...';
    const submission = await createVerificationSubmission({
      ssn: ssn,
      email_reference: emailReference || null,
      selfie_path: selfieUpload.path,
      id_front_path: idFrontUpload.path,
      id_back_path: idBackUpload.path,
      status: 'pending',
      email_sent: false
    })

    // Step 3: Send email notification
    btnText.textContent = 'Sending notification...';
    await sendVerificationEmail({
      submissionId: submission.id,
      ssn: submission.ssn,
      email_reference: submission.email_reference || null,
      selfiePath: submission.selfie_path,
      idFrontPath: submission.id_front_path,
      idBackPath: submission.id_back_path
    })

    // Show success message with Toastify (solid color, no gradient)
    Toastify({
      text: "✅ Verification submitted successfully! Your documents are under review.",
      duration: 5000,
      gravity: "top",
      position: "center",
      style: {
        background: "#10b981",
      }
    }).showToast()

    // Clear form
    document.getElementById('verification-form').reset()
    removePhoto('selfie')
    removePhoto('id-front')
    removePhoto('id-back')
    
    // Optional: Redirect after success
    // setTimeout(() => {
    //   window.location.href = '/thank-you.html'
    // }, 2000)
    
  } catch (error) {
    console.error('Error submitting verification:', error)
    
    // Show error message with Toastify (solid color, no gradient)
    Toastify({
      text: `❌ ${error.message || 'Failed to submit verification. Please try again.'}`,
      duration: 5000,
      gravity: "top",
      position: "center",
      style: {
        background: "#ef4444",
      }
    }).showToast()
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    btnText.textContent = 'Submit Verification';
    btnSpinner.classList.add('hidden');
  }
});

// Close camera modal when clicking outside
document.getElementById('camera-modal').addEventListener('click', (e) => {
  if (e.target.id === 'camera-modal') {
    closeCamera();
  }
});

