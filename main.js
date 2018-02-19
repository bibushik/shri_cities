$(document).ready(function () {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    var commonMap;
    ymaps.ready(function(){
        commonMap = new ymaps.Map("map", {
            center: [55.76, 37.64],
            zoom: 1
        });
        displayCitiesOnMap();
    });

    var CITIES = SHRI_CITIES;
    $('#game').on('submit', function(event){
        var userInput = $('#city').val();
        UserPlay(userInput);
    });
    $('#gameOver').on('click', function () {
        gameOver('user');
    });
    $('#speech').on('click', function () {
        recognition.start();
    });
    recognition.addEventListener('speechstart', function() {
        console.log('Speech has been detected.');
    });
    recognition.addEventListener('result', function(e) {
        console.log('Result has been detected.');
        var last = e.results.length - 1;
        var text = e.results[last][0].transcript;

        console.log('Confidence: ' + e.results[0][0].confidence);

        $('#city').text(text);
    });
    recognition.addEventListener('speechend', function () {
        recognition.stop();
    });

    recognition.addEventListener('error', function(e) {
        console.log('Error: ' + e.error);
        alert("Проверьте, разрешен ли доступ к микрофону для этого сайта");
    });


    function gameOver(loser){
        if (loser === 'pc'){
            alert('Игра окончена! Вы выиграли! :) ');
        } else if (loser === 'user'){
            alert('Игра окончена! Вы проиграли! :( ');
        }
        restartGame();
    }
    function restartGame(){
        clearLocalStorage();
        clearView();
    }
    function clearLocalStorage(){
        localStorage.clear();
    }
    function clearView() {
        updateView();
    }

    function UserPlay(userInput) {
        localStorage.setItem('currentPlayer', 'user');
        var cityName = processUserInput(userInput);
        var isFirstLetterRight = checkCityFirstLetter(cityName);
        if(isFirstLetterRight){
            var isFirstTime = checkCityForRepeat(cityName);
        } else {
            var lastLetter = getLastLetter();
            errorHandler('wrongFirstLetter', lastLetter);
            return false;
        }

        if(isFirstTime){
            var isCityReal = checkCityExists(cityName);
        } else{
            errorHandler('alreadyExists');
            return false;
        }

        if(isCityReal){
            saveCity(cityName);
        } else {
            errorHandler('noSuchCity');
            return false;
        }
        localStorage.setItem('nextMove', true);
        saveLetterForNextMove(cityName);
        updateView();
    }

    function PCPlay() {
        localStorage.setItem('currentPlayer', 'pc');
        var pcAnswer = getRandomCity();
        if (pcAnswer){
            saveCity(pcAnswer);
        } else {
            gameOver('pc');
        }
        saveLetterForNextMove(pcAnswer);
        updateView();
    }



    function processUserInput(userInput) {
        /*TODO add xss protection*/
        var cityNameLoweCase = userInput.toString().toLowerCase();
        var cityName = capitalizeWord(cityNameLoweCase);
        return cityName;
    }
    function capitalizeWord(string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }

    function checkCityFirstLetter(cityName) {
        var lastLetter = getLastLetter();
        var cityFirstLetter = cityName.charAt(0);
        if (lastLetter){
            if(lastLetter === cityFirstLetter){
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }
    function checkCityForRepeat(cityName) {
        var usedCities = getAllUsedCitiesList();
        if(usedCities && usedCities.indexOf(cityName)>=0){
            return false;
        } else {
            return true;
        }

    }
    function checkCityExists(cityName) {
        if(CITIES.indexOf(cityName)>=0){
            return true;
        } else {
            return false;
        }

    }

    function errorHandler(errorType) {
        switch (errorType){
            case 'alreadyExists':
                alert('Такой город уже был назван. Попробуйте еще раз');
                localStorage.setItem('nextMove', false);
                break;
            case 'noSuchCity':
                alert('Такой город не существует. Попробуйте еще раз');
                localStorage.setItem('nextMove', false);
                break;
            case 'wrongFirstLetter':
                localStorage.setItem('nextMove', false);
                alert('Город должен начинаться на букву '+ arguments[1] + '. Попробуйте еще раз');
                break;
            default:
                alert('Unhandled error type');
        }
    }

    function saveCity(cityName) {
        var currentPlayer = localStorage.getItem('currentPlayer');
        if (currentPlayer === 'user'){
            var userUsedCities = getUserUsedCitiesList();
            if(userUsedCities){
                userUsedCities.push(cityName);
            } else {
                userUsedCities=[cityName];

            }
            localStorage.setItem('userCities', JSON.stringify(userUsedCities));
        } else if(currentPlayer === 'pc'){
            var pcUsedCities = getPCUsedCitiesList();
            if(pcUsedCities){
                pcUsedCities.push(cityName);
            } else {
                pcUsedCities=[cityName];

            }
            localStorage.setItem('pcCities', JSON.stringify(pcUsedCities));
        }
    }

    function getUserUsedCitiesList(){
        var userUsedCities = JSON.parse(localStorage.getItem('userCities'));
        return userUsedCities;
    }
    function getPCUsedCitiesList(){
        var pcUsedCities = JSON.parse(localStorage.getItem('pcCities'));
        return pcUsedCities;
    }
    function getAllUsedCitiesList(){
        var userUsedCities = JSON.parse(localStorage.getItem('userCities'));
        var pcUsedCities = JSON.parse(localStorage.getItem('pcCities'));
        if (userUsedCities && pcUsedCities){
            var commonUsedCities = userUsedCities.concat(pcUsedCities);
            return commonUsedCities;
        } else if (userUsedCities){
            return userUsedCities;
        } else {
            return pcUsedCities;
        }

    }

    function saveLetterForNextMove(cityName) {
        var letterToSave = getLetterToSave(cityName);
        localStorage.setItem('lastLetter', letterToSave);
    }

    function getLetterToSave(cityName) {
        var lettersToAvoid = ['ъ', 'й', 'ы', 'ь'];
        var lastLetter = cityName.slice(-1);
        if(lettersToAvoid.indexOf(lastLetter)>=0){
            return cityName.slice(-2, -1).toUpperCase()
        } else{
            return lastLetter.toUpperCase();
        }
    }
    function getLastLetter() {
        return localStorage.getItem('lastLetter');
    }

    function updateView() {
        displayCityNames();
        displayNextAction();
    }
    function displayCityNames() {
        var userCities = getUserUsedCitiesList();
        var pcCities = getPCUsedCitiesList();
        if (userCities){
            $('#user').text(userCities);
        }
        if (pcCities){
            $('#pc').text(pcCities);
        }
    }
    function displayCitiesOnMap() {
        var usedCities = getAllUsedCitiesList();
        $.each(usedCities, function(){
            console.log(this);
            var cityNameCapitalized = this.replace(this[0], this[0].toUpperCase());
            var myGeocoder = ymaps.geocode(cityNameCapitalized,{
                kind: "locality",
                results: 1
            });
            myGeocoder.then(
                function (res) {
                    var nearest = res.geoObjects.get(0);
                    var name = nearest.properties.get('name');
                    nearest.properties.set('iconContent', name);
                    nearest.options.set('preset', 'twirl#redStretchyIcon');
                    commonMap.geoObjects.add(res.geoObjects);
                },
                function (err) {
                    console.log(err);
                }
            );
        });

    }
    function displayNextAction() {
        var gameActionField = $('#gameAction');
        var lastLetter = getLastLetter();
        if(lastLetter){
            var actionText = 'Назовите город на букву ' + lastLetter;
            gameActionField.text(actionText);
        } else {
            gameActionField.text('Назовите любой город');
        }
    }

    function presetForAMove(){
        updateView();
        var currentPlayer = localStorage.getItem('currentPlayer');
        var changePlayer = localStorage.getItem('nextMove');
        if (currentPlayer === 'user' && changePlayer === 'true'){
            PCPlay();
        }
    }

    function getRandomCity() {
        var citiesOptions = getCitiesOptions();
        if (citiesOptions.length){
            var randomCityNumber = generateRandomNumber(citiesOptions.length);
            var randomCity = citiesOptions[randomCityNumber];
            return randomCity;
        }
    }
    function getCitiesOptions(){
        var citiesOptions = CITIES.filter(isCityAnOption);
        return citiesOptions;
    }
    function isCityAnOption(city) {
        var usedCities = getAllUsedCitiesList();
        var lastLetter = getLastLetter();
        return ((city.charAt(0) === lastLetter) && (usedCities.indexOf(city) === -1));
    }
    function generateRandomNumber(quantity){
        return Math.floor(Math.random() * Math.floor(quantity));
    }

    presetForAMove();
});

doDrawing = function(data, $chartDiv, height, width, errorFunction) {

    var negativeWidth = data.negative_percentage[0].raw_data;
    var positiveWidth = 100 - negativeWidth;

    var doubleLineChartContainer = document.createElement('div');

    var positiveLine = drawLinePart('positive',positiveWidth,height);
    var negativeLine = drawLinePart('negative',negativeWidth, height);

    doubleLineChartContainer.appendChild(positiveLine);
    doubleLineChartContainer.appendChild(negativeLine);

    $chartDiv.appendChild(doubleLineChartContainer);
    return $chartDiv;


    function drawLinePart(type, width, height) {
        var progressContainer = document.createElement('div');
        if (type === 'positive'){
            progressContainer.setAttribute("id", "positiveProgressContainer");
        } else if (type === 'negative'){
            progressContainer.setAttribute("id", "negativeProgressContainer");
        }
        progressContainer.setAttribute("style", "width:" + width +"; background-color: grey; display: inline-block");

        var progressBar = document.createElement('div');
        progressBar.setAttribute("style", "width:" + width + "%; height:" + height + "px;");
        if (type === 'positive'){
            progressContainer.setAttribute("id", "positiveProgressBar");
            progressBar.style.backgroundColor = "green";
        } else if (type === 'negative'){
            progressContainer.setAttribute("id", "negativeProgressBar");
            progressBar.style.backgroundColor = "red";
        }
        progressContainer.appendChild(progressBar);
        return progressContainer;
    }



}