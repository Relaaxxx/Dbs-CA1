// you can modify the code 
// you will need to add code to handle the form submission

window.addEventListener('DOMContentLoaded', function () {

    const token = localStorage.getItem('token');
    const reviewId = localStorage.getItem('reviewId');


    const form = document.querySelector('form'); // Only have 1 form in this HTML
    form.querySelector('input[name=reviewId]').value = reviewId;

});
