var breeds;

$(document).ready(function(){

  $('#breed_search').on('input', function(e) {
    var search_str = $(this).val();
    searchBreeds(search_str);
  });

  function searchBreeds(search_str) {
    var string_length = search_str.length // get the length of the search string so we know how many characters of the breed name to compare it to
    search_str = search_str.toLowerCase(); // ensure search string and breed name are same case otherwise they won't match
    for (var i = 0; i < breeds.length; i++) // loop through all the breeds in order
    {
      var breed_name_snippet = breeds[i].name.substr(0, string_length).toLowerCase(); // get the first few cahracters of the name
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
    $('#breed_image').attr('src', "");
    $("#breed_data_table tr").remove();
  }
  
  // display the breed image and data
  function displayBreed(image) {
    $('#breed_image').attr('src', image.url);
    $("#breed_data_table tr").remove();
    $("#breed-name").text(image.breeds[0].name);
    $("#breed-height").text("Height: " + image.breeds[0].height.metric + " inches");
    $("#breed-weight").text("Weight: " + image.breeds[0].weight.metric + " lbs");
    $("#breed-temperment").text("Temperament: " + image.breeds[0].temperament);
    $("#breed-lifespan").text("Life Span: " + image.breeds[0].life_span);
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
})