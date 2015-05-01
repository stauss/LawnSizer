var placeSearch, autocomplete;
var orgPin = {
    url: 'images/orgPin.png',
    size: new google.maps.Size(22, 50),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(12, 42)
  };
var whtPin = {
  url: 'images/whtPin.png',
  size: new google.maps.Size(17, 31),
  origin: new google.maps.Point(0, 0),
  anchor: new google.maps.Point(7, 32)
};
var grnPin = {
  url: 'images/grnPin.png',
  size: new google.maps.Size(22, 50),
  origin: new google.maps.Point(0, 0),
  anchor: new google.maps.Point(12, 42)
};
var map, geocoder, placeSearch, autocomplete, address, houseMarker, makingPoly;
var paths = [new google.maps.MVCArray];
var calculators = new google.maps.MVCArray();
var isFirst = true;
var firstPoly = true;

function initialize() {
  // Create the autocomplete object, restricting the search
  // to geographical location types.
  autocomplete = new google.maps.places.Autocomplete(
      /** @type {HTMLInputElement} */(document.getElementById('addressCompleter')),
      { types: ['geocode'] });
  // When the user selects an address from the dropdown,
  // populate the address fields in the form.
  google.maps.event.addListener(autocomplete, 'place_changed', function() {
	findAddress();
  });

  var mapOptions = {
    zoom: 4,
    center: new google.maps.LatLng(38.5000, -98.0000),
	mapTypeId: google.maps.MapTypeId.SATELLITE,
	streetViewControl: false,
    zoomControl: true,
    zoomControlOptions: {
       position: google.maps.ControlPosition.RIGHT_CENTER
    },
	draggableCursor:'crosshair',
	mapTypeControl: false
  };
  
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);
  
  newPoly(true);
  
  geocoder = new google.maps.Geocoder();
  //$("#showBtn").hide();
}
google.maps.event.addDomListener(window, 'load', initialize);


function findAddress() {
  //debugger;
  address = null;
  if (address == null){ 
	  address = document.getElementById("addressCompleter").value;
  }

  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      map.setZoom(20);
	  map.setTilt(0);

	  if (houseMarker == null){
	    houseMarker = new google.maps.Marker({
          position: results[0].geometry.location,
          map: map,
          icon: grnPin,
          clickable: false
        });
	  } else {
	  	houseMarker.setPosition(results[0].geometry.location);
	  }

    }
  });
  //newPoly(true);
  //document.getElementById('addressSpan').innerHTML = address;
}

function addPoint(event, path, want) {
  
  path.insertAt(path.length, event.latLng);

  if (calculators.getAt(calculators.getLength() - 1).mvcMarkers.getLength() == 0) {
    var marker = new google.maps.Marker({
      position: event.latLng,
      map: map,
      icon: orgPin,
      draggable: true
    });
	isFirst = false;
  } else {
    var marker = new google.maps.Marker({
      position: event.latLng,
      map: map,
      icon: whtPin,
      draggable: true
    });
	computeArea();
  }

  if (document.getElementById('hideBtn').innerHTML == 'Show Markers') {
  	marker.setVisible(false);
  }
  
  //marker.setTitle("" + path.length);

  google.maps.event.addListener(marker, 'dragend', function() {
  	//loop till its the marker that was clicked then set path to coords of new position of this marker
    for (var i = 0, l = calculators.getAt(calculators.getLength() - 1).mvcMarkers.getLength(); i < l && calculators.getAt(calculators.getLength() - 1).mvcMarkers.getAt(i) != marker; ++i);
    path.setAt(i, marker.getPosition());
	computeArea();
  });
  
  calculators.getAt(calculators.getLength() - 1).mvcMarkers.push(marker);
}

function newPoly(want){
	if (calculators.getLength() > 0){
		setUneditable();
    }
	
	makingPoly = true;
	isFirst = true;
	
	paths.push(new google.maps.MVCArray);
	//this adds listener to marker but adds marker on double click to zoom
    google.maps.event.addListener(map, 'click', function (event) {
      if (makingPoly){
  	  	addPoint(event, paths[paths.length - 1], want);
  	  } 
    });

	// this prevents adding marker on double clicking to zoom
	// it breaks the make new polygon button
	// var update_timeout = null;

	// google.maps.event.addListener(map, 'click', function(event) {
	//     update_timeout = setTimeout(function() {
	//         addPoint(event, paths[paths.length - 1]);
	//     }, 200);        
	// });

	// google.maps.event.addListener(map, 'dblclick', function(event) {       
	//     clearTimeout(update_timeout);
	// });
	
	var newPolygon = new google.maps.Polygon();
	if (want) {
		var polyOptions = {
	          strokeWeight: 3,
	  	      strokeColor: '#00FF40',
	          fillColor: '#00FF40'
	        };
		newPolygon.setOptions(polyOptions);
	} else {
		var polyOptions = {
	          strokeWeight: 3,
	  	      strokeColor: '#FF0000',
	          fillColor: '#FF0000'
	        };
		newPolygon.setOptions(polyOptions);
	}
    
    newPolygon.setMap(map);
    newPolygon.setPaths(new google.maps.MVCArray([paths[paths.length - 1]]));
	
    google.maps.event.addListener(newPolygon, 'click', function (event) {
      if (makingPoly){
  	    addPoint(event, paths[paths.length - 1], want);
  	  }
    });

	var calc = {
	    mvcPolygon: new google.maps.MVCArray(),
	    mvcMarkers: new google.maps.MVCArray(),
	    polygon: newPolygon,
		addFlag: want
	}

    calculators.push(calc);
}

function computeArea(){

	var area = 0;
	calculators.forEach(function(calculator, index){
		if (calculator.addFlag){
			area += google.maps.geometry.spherical.computeArea(calculator.polygon.getPath());
		} else {
			area -= google.maps.geometry.spherical.computeArea(calculator.polygon.getPath());
		}
	});

	var feet = "" + area * 10.7639104;
	var acres = "" + area * 0.000247105381;
	
	feet = feet.substring(0, feet.indexOf(".") + 3);
	acres = acres.substring(0, acres.indexOf(".") + 3);

	//document.getElementById('area').innerHTML = "Area:</br>" + feet + " Sq. ft</br>" + acres + " acres";
	//debugger;
	document.getElementById('feetRow').innerHTML = feet + ' Sq. ft</br>';
	document.getElementById('acreRow').innerHTML = acres + ' acres</br>';
}

function clearLastMarker(){

	if (calculators.getAt(calculators.getLength() - 1).mvcMarkers.getLength() == 1){
		clearAll();
	} else {
		calculators.getAt(calculators.getLength() - 1).mvcMarkers.getAt(calculators.getAt(calculators.getLength() - 1).mvcMarkers.getLength() - 1).setMap(null);
		calculators.getAt(calculators.getLength() - 1).mvcMarkers.pop();
		
		var path = new google.maps.MVCArray();

		calculators.getAt(calculators.getLength() - 1).mvcMarkers.forEach(function(marker, index) {
			path.push(marker.getPosition());
	    });
		
		paths[paths.length - 1] = path;
		calculators.getAt(calculators.getLength() - 1).polygon.setPaths(path);
		computeArea();
    }
}

function clearLastPoly(){
	paths[paths.length - 1] = null;
	paths.pop();

	var len = calculators.getAt(calculators.getLength() - 1).mvcMarkers.getLength() - 1;

	calculators.getAt(calculators.getLength() - 1).mvcMarkers.forEach(function(marker, index) {
		marker.setMap(null);
    });

    calculators.getAt(calculators.getLength() - 1).mvcMarkers.clear()

	calculators.getAt(calculators.getLength() - 1).polygon.setMap(null);
	calculators.getAt(calculators.getLength() - 1).polygon = null;
	calculators.pop();

	isFirst = true;
	makingPoly = false;
	computeArea();
}

function clearAll(){

	google.maps.event.clearInstanceListeners(calculators.getAt(calculators.getLength() - 1).polygon);
	//calculators.getAt(calculators.getLength() - 1).polygon.setEditable(false);
	calculators.getAt(calculators.getLength() - 1).mvcMarkers.forEach(function(marker, index){
		google.maps.event.clearInstanceListeners(marker);
		google.maps.event.clearInstanceListeners(marker);
	});
	google.maps.event.clearListeners(map, 'click');

	calculators.forEach(function(elem, index){
		clearLastPoly();
	});

	paths = [new google.maps.MVCArray];
	calculators = new google.maps.MVCArray();
	isFirst = true;
	makingPoly = false;
	//document.getElementById('area').innerHTML = "Area:</br>0 Sq. ft</br>0 acres";
	computeArea();
}

function reset(){
	location.reload();
}

function setUneditable(){
	google.maps.event.clearInstanceListeners(calculators.getAt(calculators.getLength() - 1).polygon);
	calculators.getAt(calculators.getLength() - 1).polygon.setEditable(false);
	calculators.getAt(calculators.getLength() - 1).mvcMarkers.forEach(function(marker, index){
		google.maps.event.clearInstanceListeners(marker);
		google.maps.event.clearInstanceListeners(marker);
	});

	google.maps.event.clearInstanceListeners(map);
	clearMarkersInLastPoly();

	var polyOptions = {
		clickable: false
    };
	calculators.getAt(calculators.getLength() - 1).polygon.setOptions(polyOptions);
}

function clearMarkersInLastPoly(){

	calculators.getAt(calculators.getLength() - 1).mvcMarkers.forEach(function(marker, index){
		marker.setMap(null);
	});

    calculators.getAt(calculators.getLength() - 1).mvcMarkers.clear();

	isFirst = true;
}

function hideMarkers(){

	if (document.getElementById('hideBtn').innerHTML == "Hide Markers") {
		calculators.forEach(function(calc, index){
			calc.mvcMarkers.forEach(function(marker, index){
				marker.setVisible(false);
			});
		});
		document.getElementById('hideBtn').innerHTML = "Show Markers";
	} else {
		calculators.forEach(function(calc, index){
			calc.mvcMarkers.forEach(function(marker, index){
				marker.setVisible(true);
			});
		});
		document.getElementById('hideBtn').innerHTML = "Hide Markers";
	}
}