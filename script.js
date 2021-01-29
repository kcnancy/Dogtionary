var breeds;
var search_str = "";

$(document).ready(function(){
  $('#adoption-info').hide();
  $('#breed-data').hide();

  // searches breed when character's are written into search bar
  $('#breed-search').on('input', function(e) {
    var search_str = $(this).val();
    searchBreeds(search_str);
  });

  // click event for dog card span breed search
  $(document).on("click", ".breedID", function() {
    $('html, body').animate({
      scrollTop: $("#breed-search").offset().top
    }, 1000);
    $("#breed-search").val(this.innerHTML);
    var search_str = $("#breed-search").val();
    searchBreeds(search_str);
  })

  function searchBreeds(search_str) {
    var string_length = search_str.length // get the length of the search string so we know how many characters of the breed name to compare it to
    search_str = search_str.toString().toLowerCase(); // ensure search string and breed name are same case otherwise they won't match
    for (var i = 0; i < breeds.length; i++) // loop through all the breeds in order
    {
      var breed_name_snippet = breeds[i].name.substr(0, string_length).toLowerCase(); // get the first few characters of the name
      if (breed_name_snippet == search_str) {
        getDogByBreed(breeds[i].id) // show the breed just as we did in the Select demo
        return; // return the function so we don't keep searching
      }
    }
  }

  // Setup the Controls
  var $breed_select = $('select.breed_select');
  $breed_select.change(function() {
    var id = $(this).children(":selected").attr("id");
    console.log(id);
    getDogByBreed(id)
  });

  // triggered when the breed select control changes
  function getDogByBreed(breed_id) {
    // search for images that contain the breed (breed_id=) and attach the breed object (include_breed=1)
    ajax_get('https://api.thedogapi.com/v1/images/search?include_breed=1&breed_id=' + breed_id, function(data) {

      if (data.length == 0) {
        // if there are no images returned
        clearBreed();
        $("#breed_data_table").append("<tr><td>Sorry, no Image for that breed yet</td></tr>");
      } else {
        //else display the breed image and data
        displayBreed(data[0])
      }
    });
  }

  // clear the image and table
  function clearBreed() {
    $('#breed-image').attr('src', "");
  }
  
  // display the breed image and data
  function displayBreed(image) {
    $('#breed-image').attr('src', image.url);
    $("#breed-name").text(image.breeds[0].name);
    $("#breed-height").text("Height: " + image.breeds[0].height.metric + " inches");
    $("#breed-weight").text("Weight: " + image.breeds[0].weight.metric + " lbs");
    $("#breed-temperment").text("Temperament: " + image.breeds[0].temperament);
    $("#breed-lifespan").text("Life Span: " + image.breeds[0].life_span);
    $('#breed-data').show();
  }

  // make an Ajax request
  function ajax_get(url, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        // console.log('responseText:' + xmlhttp.responseText);
        try {
          var data = JSON.parse(xmlhttp.responseText);
        } catch (err) {
          console.log(err.message + " in " + xmlhttp.responseText);
          return;
        }
        callback(data);
      }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.send();
  }

  // Loads the breeds into the dropdown list
  function populateBreedsSelect(breeds) {
    $breed_select.empty().append(function() {
      var output = '';
      $.each(breeds, function(key, value) {
        output += '<option id="' + value.id + '">' + value.name + '</option>';
      });
      return output;
    });
  }

  // On initial page load, gets all of the available breeds and assigns that data to the breeds variable
  function getBreeds() {
    ajax_get('https://api.thedogapi.com/v1/breeds', function(data) {
      populateBreedsSelect(data)
      breeds = data
    });
  }

  // call the getBreeds function which will load all the Dog breeds into the dropdown list
  getBreeds();

  // listens for the click on the zip code search button to run the petfinder api call
  $("#search-button").on("click", function() {
    petFinderSearch();
  });

  // listens for the enter key on the zip code search to run the petfinder api call
  $("#search-value").keydown(function (event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      petFinderSearch();
    }
  });

// Bearer token type for authentication for petfinder.com
function petFinderSearch() {
      $.ajax({
        url: "https://api.petfinder.com/v2/oauth2/token",
        method: 'POST',
        data: {
            grant_type: "client_credentials",
            client_id: "czNLzejOZe06Un6VKP0lnnhVn0s0Z0W7sA2m2riGeYNE73Y6oz",
            client_secret: "Z6hCzpkfaB1XhCqCC4PiokKvAyIAj4bwIQWA2Hsy"
        },
        success: dogSearch
    })
}


function dogSearch(obj) {

  //Error code for incorrect zip code entry
  var zipCode = $("#search-value").val().trim();
  var errorDiv =  $("#error");

  function error() {
    var incorrectZip = $("<p>").text("Please enter a valid zip code");
    errorDiv.append(incorrectZip);    
  }

  //Search locate by zip code API
$.ajax ({
    url: "https://api.petfinder.com/v2/organizations?location=" + zipCode,
    method: 'GET',
    headers: {
        "Authorization": obj.token_type + " " + obj.access_token
    },
    statusCode: {
      400: error()
    },
    success: function(result){  
        console.log(result);
        errorDiv.hide(error());
        var arr = result.organizations.splice(0, 10);
        var idQuery = arr.map((o,i)=> o.id).join(",");
        var limitVar = "&limit=30";

        // Grabs animals from locations found by zip code
        $.ajax ({
          url: "https://api.petfinder.com/v2/animals" + "?organization=" + idQuery + limitVar,
          method: 'GET',
          headers: {
            "Authorization": obj.token_type + " " + obj.access_token
        },
          success: function(data) {
            console.log(data.animals);
            var animals = data.animals;
            var dogArray = animals.filter(dog => dog.type === "Dog");
            
            // sets the dogImg div to empty before running a new zip code search
            $('#dogImg').empty();
            
            for(i = 0; i < dogArray.length; i++) {
              var animal = dogArray[i];
              var container = $("<div>").addClass("p-5");
              var card = $("<div>").addClass("max-w-sm rounded bg-green-50 overflow-hidden shadow-lg")
              var img = $("<img>").attr("src", animal.primary_photo_cropped.small).addClass("w-full").attr("alt", animal.name);
              // Inner 1
              var cardInner = $("<div>").addClass("px-6 py-4");
              var cardTitle = $("<div>").addClass("font-bold text-xl mb-2").text(animal.name);
              var cardDesc = $("<p>").addClass("text-gray-700 text-base").text(animal.description);
              // Inner 2
              var cardInner2 = $("<div>").addClass("px-6 py-4 pb-2");
              var span1 = $("<span>").addClass("inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2").text(animal.contact.email);
              var span2 = $("<span>").addClass("inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2").text(animal.contact.phone);
              var span3 = $("<span>").addClass("inline-block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2 breedID").text(animal.breeds.primary);
              var moreInfo = $("<a href ='" + animal.url + "'>").addClass("py-2").css("color", "blue").text("More info...");
            
                // Appends objects to DOM
              cardInner2.append(span1, span2, span3);
              cardInner.append(cardTitle, cardDesc, moreInfo);
              card.append(img, cardInner, cardInner2);
              container.append(card);
              $("#dogImg").append(container);
              $('#adoption-info').show();
            }
          }
        })
    }
})
}
})

// $(".breedID").click(function() {
//   $('html, body').animate({
//     scrollTop: $("#breed-search").offset().top
//   }, 1000);
//   var search_str = $("#breed-search").val(this.innerHTML);
//   console.log(search_str);
// })

// moved this to bottom of page for cleanup. Unsure if still needed?

