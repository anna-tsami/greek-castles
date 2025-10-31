function get_wikidatum(id) {
    console.log('Getting from Wikidata entity:', id);
    let url = get_wikidatum_url(id);
    console.log('API endpoint:', url);

    return new Promise((resolve, reject) => {
        $.getJSON(url, function (data) {
            // Extract lat/long
            const latlong = get_json_value(['entities', id, 'claims', 'P625', 0, 'mainsnak', 'datavalue', 'value'], data);
            const latlon = latlong
                ? { lat: latlong.latitude, lon: latlong.longitude }
                : null;

            // Extract image name
            const imageName = get_json_value(['entities', id, 'claims', 'P18', 0, 'mainsnak', 'datavalue', 'value'], data);

            if (imageName) {
                // Fetch the thumbnail asynchronously
                get_thumbnail(imageName, 1000)
                    .then(imageUrl => {
                        resolve({
                            latlong: latlon,
                            image: imageUrl
                        });
                    })
                    .catch(err => {
                        console.warn('Thumbnail fetch failed:', err);
                        resolve({
                            latlong: latlon,
                            image: null
                        });
                    });
            } else {
                // No image property
                resolve({
                    latlong: latlon,
                    image: null
                });
            }

        }).fail((jqxhr, textStatus, error) => {
            console.error('Error getting Wikidata:', textStatus, error);
            reject(error);
        });
    });
}

function get_wikidatum_url(id) {
    return `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&format=json&languages=en|el&origin=*`;
}

function get_thumbnail(photoname, size) {
    return new Promise((resolve, reject) => {
        photoname = photoname.replaceAll(' ', '_');
        console.log('Getting ' + size + 'px thumb of:', photoname);

        let url = `https://api.wikimedia.org/core/v1/commons/file/File:${photoname}`;
        $.getJSON(url, function (data) {
            const images = [
                {
                    url: get_json_value(['thumbnail', 'url'], data),
                    size: Math.abs(size - get_json_value(['thumbnail', 'width'], data)),
                },
                {
                    url: get_json_value(['original', 'url'], data),
                    size: Math.abs(size - get_json_value(['original', 'width'], data)),
                },
                {
                    url: get_json_value(['preferred', 'url'], data),
                    size: Math.abs(size - get_json_value(['preferred', 'width'], data)),
                }
            ].filter(image => !!image.url);

            if (images.length > 0) {
                const closestToSizeImage = images.reduce((min, item) => 
                    item.size < min.size ? item : min
                );
                const imageUrl = closestToSizeImage.url;
                console.log('Thumbnail URL:', imageUrl);

                // You can still update your image element if desired
                $('#wikidata_img').attr('src', imageUrl);

                resolve(imageUrl);
            } else {
                reject('No image found');
            }
        }).fail(function () {
            reject('Error fetching thumbnail');
        });
    });
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

Promise.allSettled(pois.map(poi =>{
   return new Promise((resolve, reject) => {
    get_wikidatum(poi.id)
      .then(data => resolve({
        ...poi,
        ...data
      }))
      .catch(err => {
          console.warn('Poi fetch failed:', err);
          reject('Failed to fetch poi');
      });
   })
}))
.then(results => {
    const totalPois = pois.length
    const resolvedPois = results.map( result => result.value);

    let center = resolvedPois.reduce((previous, current) => {
      return {
        lat: previous.lat + current.latlong.lat, lon: previous.lon + current.latlong.lon
      }
    }, {lat: 0, lon: 0});

    center = { lat: center.lat / totalPois , lon: center.lon / totalPois }

    var map = L.map('map', {fullscreenControl: { pseudoFullscreen: true } }).setView([center.lat, center.lon], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution: '© OpenStreetMap'}).addTo(map);
    console.log(resolvedPois)
    resolvedPois.forEach(({latlong, title, image, url}) => {
      var marker = L.marker([latlong.lat, latlong.lon]).addTo(map);
      const popupHtml = `
        <div style="text-align:center;aspect-ratio:1.35;width:150px; padding:5px">
          <img src="${image}" alt="${title}" width="100%" height="auto" style="border-radius:8px;margin-bottom:10px">
          <h4><a href="${url}" target="_blank">${title}</a></h4>
        </div>
      `;
      marker.bindPopup(popupHtml);
    });
    
});
