$(document).foundation();

var OPTS = {
  bbox: null,
  annotation: null,
  img: null,
  formId: 'image-form',
  imgId: 'file-img',
  imgTextId: 'file-url',
  contId: 'results-container',
  msgPlaceId: 'adz-msg-place',
  searchByBtn: 'searchByBtn',
  searchMsgPlaceId: 'adz-search-msg-place',
  submitUrlId: 'submit-url',
  searchImgId: 'search-by',
  spinnerCls: 'spinner-wrap',
  canvasContainerId: 'canvas-wrapper',
  uriOk: '/assets/index.json',
  uriFail: '/assets/indexError.json'
};

$('#' + OPTS.imgId).on('change', function (e) {
  readImgFile(getById(OPTS.imgId), getById(OPTS.canvasContainerId), populateCanvas);
});
$('#' + OPTS.searchByBtn).on('click', function (e) {
  sendForm(getById(OPTS.formId));
});
$('#' + OPTS.submitUrlId).on('click', function (e) {
  e.preventDefault();
  var imgTextInput = getById(OPTS.imgTextId);
  if (imgTextInput.value !== '') {
    readImgText(imgTextInput, getById(OPTS.canvasContainerId), populateCanvas);
  }
});

function disposeBbox() {
  if (OPTS.bbox !== null) {
    OPTS.bbox.dispose();
  }
}

function sendForm (form) {
  var uri = OPTS.uriOk;
  var fd = new FormData(form);

  fd.append('bboxes', JSON.stringify([OPTS.annotation]));

  setSpinner(true);

  $.ajax({
    url: uri,
    data: fd,
    processData: false,
    contentType: false,
    type: 'POST',
    success: function(data){
      handleResponse(data, true);
    },
    complete: function (data) {
      setSpinner(false);
      $("html, body").animate({ scrollTop: $(document).height() }, 1500);
      $(form).find(OPTS.imgTextId).val('');
      $(form).find(OPTS.imgId).val('');
    }
  });

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

function readImgText(field, canvasCont, populateCanvas) {
  var
    image = document.createElement('img');

  // clear file input
  getById(OPTS.imgId).value = '';

  $(canvasCont).parent().removeClass('undisplay');
  setSpinner(true);
  image.onload = function () {
    $(canvasCont).height(calcBboxHeight(image, canvasCont));
    populateCanvas(image, canvasCont, saveBbox, saveAnnotation);
  };
  image.setAttribute('src', field.value);
}

function readImgFile(field, canvasCont, populateCanvas) {
  var image = document.createElement('img'),
    reader = new FileReader();

  // clear text input
  getById(OPTS.imgTextId).value = '';

  $(canvasCont).parent().removeClass('undisplay');
  setSpinner(true);
  reader.onload = function (e) {
    image.onload = function () {
      OPTS.img = image;
      $(canvasCont).height(calcBboxHeight(image, canvasCont));
      populateCanvas(image, canvasCont, saveBbox, saveAnnotation);
    };
    image.setAttribute('src', e.target.result);
  };
  reader.readAsDataURL(field.files[0]);
}

function calcBboxHeight (image, canvasCont) {
  var tempContHeight = $(canvasCont).width() * image.height / image.width;
  if (image.height < tempContHeight) {
    tempContHeight = image.height;
  }
  return tempContHeight;
}

function populateCanvas (image, canvasCont, saveBbox, saveAnnotation) {
  disposeBbox();
  var bbox = Bbox({
    canvasContainer: canvasCont,
    img: image,
    onload: function () {
      setSpinner(false);
    }
  });
  bbox.subscribe(function (annotation) {
    saveAnnotation(annotation)
  });
  saveAnnotation({x1: 0, x2: image.width, y1: 0, y2: image.height});
  saveBbox(bbox);
}

function setImgAttrs (imgObj, attrs) {
  var i = 0,
    attrsLgth = attrs.length;

  if (attrs.length > 0) {
    for (i; i < attrsLgth; i++) {
      imgObj[attrs[i].name] = attrs[i].value;
    }
  }

  return imgObj;

}

function getById (id) {
  return document.getElementById(id);
}

function saveBbox (bbox) {
  OPTS.bbox = bbox;
  return bbox;
}

function saveAnnotation (annotation) {
  OPTS.annotation = annotation;
  return annotation;
}

function getBboxCanvas () {
  var canvasCont = getById(OPTS.canvasContainerId),
    canvas = canvasCont.getElementsByTagName('canvas')[0];
  return canvas;
}

function prepareImgData (getCanvas, annotation) {
  var a = annotation,
    img = OPTS.img,
    canvas = document.createElement('CANVAS'),
    ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0, img.width, img.height);
  return ctx.getImageData(a.x1, a.y1, a.x2 - a.x1, a.y2 - a.y1);
}

function createCanvasFromData (imageData, annotation) {
  var a = annotation,
    canvas = document.createElement('CANVAS'),
    ctx = canvas.getContext('2d');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function setSearchByImage (canvas) {
  document.getElementById(OPTS.searchImgId)
    .setAttribute('src', canvas.toDataURL("image/png"));
}