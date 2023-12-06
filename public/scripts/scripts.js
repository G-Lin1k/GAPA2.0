//scripts on index.ejs

document.getElementById('loginButton').addEventListener('click', function() {
    window.location.href = '/login_gapa';
});

document.getElementById('signUpButton').addEventListener('click', function() {
    window.location.href = '/create_account';
});

//scripts on profile.ejs
const imageUploadInput = document.getElementById("image-upload");
const uploadedImage = document.getElementById("uploaded-image");

imageUploadInput.addEventListener("change", function () {
    const file = this.files[0]; // Get the selected file

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            uploadedImage.src = e.target.result; // Display the uploaded image
        };

        reader.readAsDataURL(file);
    } else {
        uploadedImage.src = ""; // Clear the image if no file is selected
    }
});

document.addEventListener('DOMContentLoaded', () => {
const editJobButton = document.getElementById('editJobButton');
    const editJobForm = document.getElementById('editJobForm');

    editJobButton.addEventListener('click', () => {
        editJobForm.style.display = editJobForm.style.display === 'none' ? 'block' : 'none';
    });
});