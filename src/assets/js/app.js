$(document).foundation();

var OPTS = {
  formId: 'image-form',
  imgId: 'file-img',
  contId: 'results-container',
  msgPlaceId: 'adz-msg-place',
  searchMsgPlaceId: 'adz-search-msg-place',
  submitUrlId: 'submit-url',
  searchImgId: 'search-by',
  spinnerCls: 'spinner-wrap',
  uriOk: '/assets/index.json',
  uriFail: '/assets/indexError.json'
};

$('#' + OPTS.imgId).on('change', commonHandler);
$('#' + OPTS.submitUrlId).on('click', commonHandler);

function commonHandler (e) {
  var form = document.getElementById(OPTS.formId);
  clearInputs(e, form);
  readImg(form);
  sendForm(e, form);
}

function clearInputs (e, form) {
  if (e.type === 'change') {
    if (form[0].value !== '') {
      form[0].value = '';
    }
    if (form[1].files.length === 0) {
      return false;
    }
  }
}

function sendForm (e, form) {
  var uri = OPTS.uriOk;
  // var xhr = new XMLHttpRequest();
  var fd = new FormData(form);

  setSpinner(true);

  $.ajax({
    url: uri,
    data: fd,
    processData: false,
    type: 'GET',
    success: function(data){
      handleResponse(data, true);
      setSpinner(false);
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
        setMessage(OPTS.msgPlaceId, 'Results:');
        for (i = 0; i < imLgth; i++) {
          if (staticRandom) {
            randData = res[getRandomInt(0, resLength - 1)];
            updateImg(images[i], randData);
          } else {
            updateImg(images[i], res[i]);
          }
        }
      } else {
        setMessage(OPTS.msgPlaceId, 'No matches in DB');
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
      setMessage(OPTS.msgPlaceId, erStr);
    } else {
      setMessage(OPTS.msgPlaceId, msg);
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

function setMessage (containerId, msg) {
  $('#' + containerId).html(msg);
}

function setSpinner(bool) {
  var spinnerWrap = $('.' + OPTS.spinnerCls);
  bool ? spinnerWrap.removeClass('undisplay') : spinnerWrap.addClass('undisplay');
}

function readImg(form) {

  if (form[0].value !== '') {
    $('#' + OPTS.searchImgId)
      .attr('src', form[0].value);
  }
  if (form[1].files.length > 0) {
    var reader = new FileReader();

    reader.onload = function (e) {
      $('#' + OPTS.searchImgId)
        .attr('src', e.target.result)
    };

    reader.readAsDataURL(form[1].files[0]);
  }

  setMessage(OPTS.searchMsgPlaceId, 'Search by:');

}