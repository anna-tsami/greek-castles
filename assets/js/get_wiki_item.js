console.log("Fetch: ", wikidatum);

function get_wikidatum(id){
    console.log('Getting from wikidata entity: ', id);
    // WikiMedia API based:
    let url = get_wikidatum_url(id);
    // WikiData URI based:
    // let url = `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`;
    console.log('API endpoint:', url);
    var jqxhr = $.getJSON( url, function(data) {
          //console.log( "Success; entities returned: ", Object.keys(data).length );
          let description = get_json_value(['entities',id,'descriptions','el','value'], data);
          if (description)
            $('#wikidata_descr').text( get_first_upper(description) );

          let elwikititle = get_json_value(['entities',id,'sitelinks','elwiki','title'], data);
          if (elwikititle) {
            $('#wikidata_title').text( get_first_upper(elwikititle) );
            $('#wikidata_href').attr('href', 'https://el.wikipedia.org/wiki/'+elwikititle );
            $('#wikipedia_title').text('https://el.wikipedia.org/wiki/'+elwikititle );
          }


          let latlong = get_json_value(['entities',id,'claims','P625', 0,'mainsnak', 'datavalue', 'value'], data);
          if (latlong) {
              //$('#wikidata_location').text(JSON.stringify(value) );
              console.log('Create map');
              var map = L.map('map', {fullscreenControl: { pseudoFullscreen: true } }).setView([latlong.latitude, latlong.longitude], 13);
              L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution: '© OpenStreetMap'}).addTo(map);
              var marker = L.marker([latlong.latitude, latlong.longitude]).addTo(map);
              marker.bindPopup(elwikititle).openPopup();
          }

          const p571Value = get_json_value(['entities',id,'claims','P571', 0,'mainsnak', 'datavalue', 'value'], data);

          if (p571Value) {
            $('.wikidata_p571').show();

            const time = p571Value.time
            const precision = p571Value.precision

            if ( precision > 8 ) {
                const dateObject = wikidataTimeToDateObject(time, precision)
                $('#wikidata_created').append(dateObject.year);
                $('#wikidata_created').attr('datetime', dateObject.iso);
            } else {
                $('#wikidata_created').append(p571Value.time)
            }
          }

          const p31Value = get_json_value(['entities',id,'claims','P31', 0,'mainsnak', 'datavalue', 'value'], data);
          if (p31Value) {
            const p31Id = p31Value.id
            $.getJSON( get_wikidatum_url(p31Id), function(data) {
                label = get_json_value(['entities',p31Id,'labels','el','value'], data);
                if (label) {
                    $('#wikidata-is').text(label);
                    $('.wikidata_p31').show();
                }
            })
            .fail(function( jqxhr, textStatus, error ) {
                console.log( "Error getting wikidata. ", textStatus, error );
            });
          }

          const p276Value = get_json_value(['entities',id,'claims','P276', 0,'mainsnak', 'datavalue', 'value'], data);
          if (p276Value) {
            const p276Id = p276Value.id
            $.getJSON( get_wikidatum_url(p276Id), function(data) {
                label = get_json_value(['entities',p276Id,'labels','el','value'], data);
                if (label) {
                    $('#wikidata-location').text(label);
                    $('.wikidata_p276').show();
                }
            })
            .fail(function( jqxhr, textStatus, error ) {
                console.log( "Error getting wikidata. ", textStatus, error );
            });
          }

          const p1435Value = get_json_value(['entities',id,'claims','P1435', 0,'mainsnak', 'datavalue', 'value'], data);
          if (p1435Value) {
            const p1435Id = p1435Value.id
            $.getJSON( get_wikidatum_url(p1435Id), function(data) {
                label = get_json_value(['entities',p1435Id,'labels','el','value'], data);
                if (label) {
                    $('#wikidata-protection').text(label);
                    $('.wikidata_p1435').show();
                }
            })
            .fail(function( jqxhr, textStatus, error ) {
                console.log( "Error getting wikidata. ", textStatus, error );
            });
          }

          let image = get_json_value(['entities',id,'claims','P18', 0,'mainsnak', 'datavalue', 'value'], data);
          get_thumbnail(image, 1000);

        })
        .fail(function( jqxhr, textStatus, error ) {
            console.log( "Error getting wikidata. ", textStatus, error );
        });
}

function get_wikidatum_url(id) {
    return `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&format=json&languages=en|el&origin=*`;
}

function get_thumbnail(photoname, size){
    photoname = photoname.replaceAll(' ', '_');
    console.log('Getting '+size+'px thumb of: ', photoname);
    // WikiMedia API based:
    let url = `https://api.wikimedia.org/core/v1/commons/file/File:${photoname}`;
    var jqxhr = $.getJSON( url, function(data) {
        let credit = get_json_value(['latest','user','name'], data);
        // console.log('Photo credit: ', credit);
        const images = [
            {
                url: get_json_value(['thumbnail','url'], data),
                size: Math.abs( size - get_json_value(['thumbnail','width'], data)),
            },
            {
                url: get_json_value(['original','url'], data),
                size: Math.abs( size - get_json_value(['original','width'], data)),
            },
            {
                url: get_json_value(['preferred','url'], data),
                size: Math.abs( size - get_json_value(['preferred','width'], data)),
            }
        ].filter(image => !!image.url)

        if ( images.length > 0) {
            const closestToSizeImage = images.reduce((min, item) => {
                return item.size < min.size ? item : min;
            });
            const url = closestToSizeImage.url

            console.log(url);
            $('#wikidata_img').attr('src', url);
        }
    })
    .fail(function() {
        console.log( "error" );
    });


}

function wikidataTimeToDateObject(time, precision) {
  // Remove leading "+" and split into components
  const [datePart] = time.replace(/^\+/, "").split("T");
  let [year, month, day] = datePart.split("-").map(Number);

  // Normalize zeros based on precision
  if (precision == 9) {
    // Year precision: month/day unknown
    month = 1;
    day = 1;
  } else if (precision === 10) {
    // Month precision: day unknown
    day = 1;
  }

  // Create a valid ISO date string
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00Z`;
  const date = new Date(iso);

  return {
    date,
    year,
    month: precision >= 10 ? month : null,
    day: precision === 11 ? day : null,
    precision: precision === 9 ? "year" : precision === 10 ? "month" : "day",
    iso
  };
}


function get_first_upper(value){
    if (typeof value === 'string' || value instanceof String)
        value = value.charAt(0).toUpperCase() + value.slice(1);
    return value;
}

function get_json_value(json_key, data){
    try{
        while ( json_key.length>1 ){
            data = data[ json_key[0]]
            json_key = json_key.slice(1);
        }
        return data[json_key[0]];
    } catch(err){
        console.error(err, json_key, JSON.stringify(data));
    }
    return null; //on error
}

get_wikidatum(wikidatum);
