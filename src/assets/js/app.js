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
  if (OPTS.bbox !== null) {
    OPTS.bbox.dispose();
  }
  readImgFile(getById(OPTS.imgId), getById(OPTS.canvasContainerId), populateCanvas);
});
$('#' + OPTS.searchByBtn).on('click', function (e) {
  var a = OPTS.annotation,
    imageData = prepareImgData(getBboxCanvas, a),
    canvas = createCanvasFromData(imageData);

  console.log(imageData, canvas);

  setSearchByImage(canvas);
});
$('#' + OPTS.submitUrlId).on('click', function (e) {
  e.preventDefault();
  readImgText(OPTS.imgTextId, getById, populateCanvas);
});

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

function sendForm (image) {
  var uri = OPTS.uriOk;
  // var xhr = new XMLHttpRequest();
  var fd = new FormData();

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

function readImgText(fldId, getF, populateF) {
  var
    image = document.createElement('img'),
    canvasCont = getF(OPTS.canvasContainerId);
  image.onload = function () {
    populateF(image, canvasCont, saveBbox, saveAnnotation);
  };
  image.setAttribute('src', getF(fldId).value);
}

function readImgFile(field, canvasCont, populateCanvas) {
  var image = document.createElement('img'),
    reader = new FileReader();
  reader.onload = function (e) {
    image.onload = function () {
      OPTS.img = image;
      populateCanvas(image, canvasCont, saveBbox, saveAnnotation);
    };
    image.setAttribute('src', e.target.result);
  };
  reader.readAsDataURL(field.files[0]);
}

function populateCanvas (image, canvasCont, saveBbox, saveAnnotation) {
  var bbox = Bbox({
    canvasContainer: canvasCont,
    img: image,
    onload: function () { console.log('loaded!') }
  });
  bbox.subscribe(function (annotation) {
    saveAnnotation(annotation)
  });
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