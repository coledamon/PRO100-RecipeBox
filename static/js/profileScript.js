$(document).ready(() =>{
    $("#profPic").on("change", "#file", function(event) {
        console.log(event);
        console.log(URL.createObjectURL(event.target.files[0]))
        $("#pfp").attr("src", URL.createObjectURL(event.target.files[0]));
    });
});



