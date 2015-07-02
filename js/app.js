
var app = angular.module('domisilapp', ['ui.router', 'ngAnimate', 'satellizer']);

//Configuración de rutas de la aplicacion web
app.config(function($stateProvider, $authProvider, $urlRouterProvider){

	// parametros de configuracion
	$authProvider.loginUrl = "http://localhost:5000/auth/login";
	$authProvider.signupUrl = "http://localhost:5000/auth/signup";

	$authProvider.tokenName = "token";
	$authProvider.tokenPrefix = "Domisil_App";

	$urlRouterProvider.otherwise('/');

	// defino rutas 
	$stateProvider
		.state('home', {
			url: '/',
			templateUrl: 'partials/home.html',
			controller: 'HomeCtrl'
		})

		.state('registro',{
			url: '/registro',
			templateUrl: 'partials/registro.html',
			controller: 'RegistroCtrl'

		})

		.state('service',{
			url: '/service',
			templateUrl: 'partials/service.html',
			controller: 'ServiceCrtl'
		})

		.state('resumen',{
			url:'/resumen',
			templateUrl: 'partials/resumen.html',
			controller: 'ResumenCrtl'
		})
		.state('login', {
			url:'/login',
			templateUrl: 'partials/login.html',
			controller: 'LoginController',
			controllerAs: 'login'
		})

		.state('signup', {
			url: '/signup',
			templateUrl: 'partials/signup.html',
			controller: 'SignUpController',
			controllerAs: 'signup'
		})
		.state('logout', {
			url: '/logout',
			templateUrl: null,
			controller: 'LogoutController'
		})
		.state('private', {
			url: '/private',
			templateUrl: 'partials/private.html',
			controller: 'PrivateController',
			controllerAs: 'private'
		});


});


app.controller('PrivateController', ['$scope', '$auth', '$location', function($scope, $auth, $location){
	if (!$auth.isAuthenticated()) {
        console.log('no estas logueado');
        $scope.mensaje = 'No estas logueado, logueate';
        $location.url('/login');
    }else{
    	$scope.mensaje = 'ahora si';	
    }
	
}]);

// para enviar el token con cada peticion http
app.config(['$httpProvider', 'satellizer.config', function($httpProvider, config){
	$httpProvider.interceptors.push(['$q', function($q){
		var tokenName = config.tokenPrefix ? config.tokenPrefix + '_' + config.tokenName : config.tokenName;
		return {
			request: function(httpConfig){
				var token = localStorage.getItem(tokenName);
				if(token && config.httpInterceptor){
					token = config.authHeader === 'Authorization' ? 'Bearer' + token: token;
					httpConfig.headers[config.authHeader] = token;
				}
				return httpConfig;
			},
			responseError: function(response){
				return $q.reject(response);
			}
		};
	}]);
}]);

// home '/' controller
app.controller('HomeCtrl', ['$scope', function($scope){
	 
}]);

//


//

//



//Servicio que es inyectado en varios controladores para
//poder tener acceso a los datos en diferentes vistas
app.factory("Compra", function() {
  return {
    servicio: {}
  };
});

//Servicio utilizado para consumir el API de google maps
app.factory('geolocation', function(){
	service = {};

	var originLatLon="";
	var destinyLatLon="";
	// var directionsService = null;
	// var directionsDisplay = null;

	service.buscar = function(){
		directionsService = new google.maps.DirectionsService();
		directionsDisplay = new google.maps.DirectionsRenderer();

		var options = {
		  componentRestrictions: {country: 'CO'}
		};

		var Origen = new google.maps.places.Autocomplete((document.getElementById('origen')),options);
		google.maps.event.addListener(Origen, 'place_changed', function() {
			var place = Origen.getPlace();
			originLatLon = place.geometry.location;
			console.log(originLatLon);
		});

		var Destino = new google.maps.places.Autocomplete((document.getElementById('destino')),options);
		google.maps.event.addListener(Destino, 'place_changed', function() {
			var place = Destino.getPlace();
			destinyLatLon = place.geometry.location;
			console.log(destinyLatLon);
		});
		return {origin:originLatLon, destination:destinyLatLon}
	}
	return service;
});


// Creo un controlador para manejar la parte de la cotización
// del usuario
app.controller('cotizadorController', ['$scope', '$http', 'Compra', '$location', 'geolocation', function($scope, $http, Compra, $location, geolocation){
	$scope.ver = false;
	geolocation.buscar();
		
	//Funcion para mostrar el mapa al hacer clic en Cotizar
	$scope.mostrarInfo = function(){
	  	$scope.ver = true;
	  	var oirigin =null;
	  	var destination = null;

	  	ruta = geolocation.buscar();
	  	console.log(ruta.origin);

	  	if (ruta.origin == "") {
	  		origin = $scope.origen + ' Bogota, Colombia';
	  	}else{
	  		origin = ruta.origin;
	  	}

	  	if (ruta.destination == "") {
	  		destination = $scope.destino + ' Bogota, Colombia';
	  	}else{
	  		destination = ruta.destination;
	  	}
	  	console.log(origin);
	  	console.log(destination);

	  	var request = {
	  		origin: origin,
	  		destination: destination,
	  		travelMode: google.maps.TravelMode.DRIVING,
	  		provideRouteAlternatives:true
	  	};

		directionsService.route(request, function(response, status){
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(response);
				$scope.distancia = response.routes[0].legs[0].distance.text;
				console.log($scope.distancia);
				// var a = Math.round($scope.distancia);
			}else{
				alert('No existen rutas entre ambos puntos');
			}

			setTimeout(function(){
				$scope.$apply(function(){
					$scope.distancia=$scope.distancia;
				})
			}, 100);
		});



		//Peticion get a la API para traer todas las epmresas y sus tarifas 
	  $http.defaults.headers.common["X-Custom-Header"] = "Angular.js";
	  $http.get('http://192.168.0.26:3000/api/emp-domiciliarios').
	  	success(function(data, status, headers, config){
	  		$scope.empresas = data;
	  	});
	};

	//Funcion para pasar los datos del servicios seleccionado por
	//el usuario a la siguiente vista donde realizará la validación
	$scope.servicioSeleccionado = function (){
		Compra.servicio.empresa = "TUSDOMICILIOS.COM";
		Compra.servicio.valor = "CO$20.000";
		Compra.servicio.origen = $scope.origen;
		Compra.servicio.destino = $scope.destino;
		$location.url("/service");
	};


}]);
//Find controlador cotizacion


//Controlador para registrar una nueva empresa al sistema
app.controller('RegistroCtrl',['$scope', '$http', function($scope, $http){
	$scope.empresa = {};
	$scope.registrarEmpresa = function(){
		console.log($scope.empresa);
			$http.post('http://192.168.0.26:3000/api/emp-domiciliarios', $scope.empresa)
			.success(function(data) {
					//$scope.empresa = {}; // Borramos los datos del formulario
					$scope.empresas = data;
					$scope.respuesta = "El registro fue éxitoso!";
					console.log('Se guardo esto: '+ $scope.empresas);
				})
			.error(function(data) {
				$scope.respuesta = "Error en el registro!";
				console.log('Error: ' + data);
			});
	};
}]);
//Fin controller empresa

//Controlador para gestionar toda la parte del servicios hasta el envio del mismo
app.controller('ServiceCrtl', ['$scope', 'Compra', '$location', function($scope, Compra, $location){
	$scope.resumen = "Resumen del servicio";
	$scope.pago = "Tipo de pago";
	$scope.empresa = Compra.servicio.empresa;
	$scope.valor = Compra.servicio.valor;
	$scope.origen = Compra.servicio.origen;
	$scope.destino = Compra.servicio.destino;
	console.log(Compra.servicio.destino);

	$scope.resumenFinal = function (){
		Compra.servicio.empresa = "TUSDOMICILIOS.COM";
		Compra.servicio.valor = "CO$20.000";
		Compra.servicio.origen = $scope.origen;
		Compra.servicio.destino = $scope.destino;
		$location.url("/resumen");
	};
}]);
//Fin controller servicio

//Controlador para mostrar el resumen final del servico
//y enviar el servicio para que sea procesado por la 
//empresa seleccionada
app.controller('ResumenCrtl', ['$scope', 'Compra', function($scope, Compra){
	$scope.titlePage = "Confirmación y envío del servicio";
	$scope.tipo = "Envío de paquetes";
	$scope.origen = Compra.servicio.origen;
	$scope.destino = Compra.servicio.destino;
	$scope.empresa = Compra.servicio.empresa;
	$scope.valor = Compra.servicio.valor;
	

	$scope.print = function(div){
		alert('Holaa');
		var printContents = document.getElementById(div).innerHTML;
	  	var popupWin = window.open('', '_blank', 'width=600,height=600');
	  	popupWin.document.open()
	  	popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="css/main.css" /></head><body onload="window.print()">' + printContents + '</html>');
	  	popupWin.document.close();
	};
}]);

// para registrar usuarios nuevos al sistema
app.controller('SignUpController', ['$scope', '$auth', '$location', function($scope, $auth, $location){
	var vm = this;
	this.signup = function(){
		$auth.signup({
			usuario: vm.usuario,
			password: vm.password
		})
		.then(function(){
			//si ha sido registrado correctamente 
			// redirigimos a otra parte
			$location.path('/private');
		})
		.catch(function(response){
			// si ha habido errors, llegaremos a esta función 
			console.log('ERROR');
		});
	}
}]);

// para ingresar al sistema sesión user
app.controller('LoginController', ['$scope', '$auth', '$location', function($scope, $auth, $location){
	var vm = this;
	this.login = function(){
		$auth.login({
			usuario: vm.usuario,
			password: vm.password
		})
		.then(function(){
			// si ha ingresado correctamente, lo tratamos aqui
			// podemos tambien redigirle a una ruta
			$location.path('/private');
		})
		.catch(function(response){
			// si ha habido errores 
			console.log("ERROR EN EL LOGIN: "+response);
		});

	}
}]);




// para cerrar sesión user
app.controller('LogoutController', ['$scope', '$auth', '$location', function($scope, $auth, $location){
    if (!$auth.isAuthenticated()) {
        return;
    }

	$auth.logout()
		.then(function(){
			// desconectamos al usuario
			$location.path('/');
		});

}]);






