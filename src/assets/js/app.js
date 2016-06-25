$(document).foundation();

var OPTS = {
  formId: 'image-form',
  imgId: 'file-img',
  contId: 'results-container',
  msgPlaceId: 'adz-msg-place',
  submitUrlId: 'submit-url',
  uriOk: '/assets/index.json',
  uriFail: '/assets/indexError.json'
};

$('#' + OPTS.imgId).on('change', sendForm);
$('#' + OPTS.submitUrlId).on('click', sendForm);

function sendForm (e) {
  var uri = OPTS.uriOk;
  // var xhr = new XMLHttpRequest();
  var form = document.getElementById(OPTS.formId);
  if (e.type === 'change') {
    if (form[0].value !== '') {
      form[0].value = '';
    }
  }
  var fd = new FormData(form);

  $.ajax({
    url: uri,
    data: fd,
    processData: false,
    type: 'GET',
    success: function(data){
      handleResponse(data, true);
    }
  });

  // xhr.open("GET", uri, true);
  // xhr.onreadystatechange = function() {
  //   if (xhr.readyState == 4 && xhr.status == 200) {
  //     handleResponse(xhr.responseText, true);
  //   }
  // };
  // xhr.send(fd);
}

function handleResponse (resObj, staticRandom) {
  var images = getImages(),
    imLgth = images.length,
    i;

  if (resObj.results) {
    var res = resObj.results[0].products;
    if (res && res instanceof Array) {
      var resLength = res.length,
        randData;
      if (res.length > 0) {
        setMessage('Results:');
        for (i = 0; i < imLgth; i++) {
          if (staticRandom) {
            randData = res[getRandomInt(0, resLength - 1)];
            updateImg(images[i], randData);
          } else {
            updateImg(images[i], res[i]);
          }
        }
      } else {
        setMessage('No matches in DB');
      }
    } else {
      handleErrors(resObj, 'No response data');
    }
  }
}

function handleErrors (resObj, msg) {
  var errors =resObj.errors,
    erStr = '',
    i;

  if (errors && errors instanceof Array) {
    var erLgth = errors.length;
    if (erLgth > 0) {
      for (i = 0; i < erLgth; i++) {
        erStr += errors[i] + '<br/>';
      }
      setMessage(erStr);
    } else {
      setMessage(msg);
    }
  }
}

function getImages () {
  return $('#' + OPTS.contId).find('img');
}

function updateImg (img, metaData) {
  img.src = metaData.images[0].imageUrl;
  img.alt = metaData.name;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setMessage (msg) {
  $('#' + OPTS.msgPlaceId).html(msg);
}