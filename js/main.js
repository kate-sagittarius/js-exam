const musixMatchKey = 'dd09d77faf4b4cfe40a00dd542b68f74';

const corsProxyUrl = 'https://cors-anywhere.herokuapp.com';

const encodeQueryParams = (params) => {
  return Object.keys(params).map((key) => {
    const value = params[key];
    return `${key}=${encodeURIComponent(value)}`;
  }).join('&');
};

const musixMatchUrl = (action, params) => {
  const encodedParams = encodeQueryParams({
    apikey: musixMatchKey,
    ...params
  });
  return `${corsProxyUrl}/api.musixmatch.com/ws/1.1/${action}?${encodedParams}`;
}

const trackSearchUrl = (option, text) => {
  return musixMatchUrl('track.search', {
    [`q_${option}`]: text,
    page_size: 5,
    page: 1,
    s_track_rating: 'desc',
  });
};

const trackLyricsUrl = (trackId) => {
  return musixMatchUrl('track.lyrics.get', {
    track_id: trackId,
  });
};

const wikipediaUrl = (params) => {
  const encodedParams = encodeQueryParams(params);
  return `${corsProxyUrl}/en.wikipedia.org/w/api.php?${encodedParams}`;
};

const getApiTrackData = (x) => {
  const {
    artist_name: artistName,
    track_name: trackName,
    album_name: albumName,
    num_favourite: likesNumber,
    track_id: trackId,
  } = x.track;
  return { artistName, trackName, albumName, likesNumber, trackId };
}

const getTrackInfo = (option, text) => {
  return axios.get(trackSearchUrl(option, text)).then(response => {
    return response.data.message.body.track_list.map((x) => getApiTrackData(x))
  });
};

const getWikipediaImageUrl = (filename) => {
  return axios.get(wikipediaUrl({
    format: 'json',
    action: 'query',
    titles: `Image:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url',
  })).then((response) => {
    const pages = Object.keys(response.data.query.pages)[0];
    return response.data.query.pages[pages].imageinfo[0].url;
  });
};

const getArtistInfo = (artistName) => {
  return axios.get(wikipediaUrl({
    format: 'json',
    action: 'query',
    prop: 'images|extracts',
    exintro: '',
    explaintext: '',
    redirects: 1,
    titles: artistName,
  })).then(response => {
    const wikiPages = Object.keys(response.data.query.pages)[0];
    const page = response.data.query.pages[wikiPages];

    const eligibleImages = page.images.filter((x) => !x.title.includes('.svg') && !x.title.includes('.ogg'));
    const imageFilename = eligibleImages[Math.floor(Math.random() * eligibleImages.length)].title.slice(5); // slice(5) = drop "File:"

    return getWikipediaImageUrl(imageFilename).then((artistPic) => {
      const artistBio = page.extract.split('\n')[0];
      return {artistPic, artistBio};
    });
});
};

document.getElementById('search-form').onsubmit = (event) => {
  event.preventDefault();

  const userOption = document.getElementById('select').value;
  const userText = document.getElementById('query').value;
  const trackInfo = getTrackInfo(userOption, userText);

  trackInfo.then((tracksList) => {
    console.log(tracksList);
    const artistName = tracksList[0].artistName;
    getArtistInfo(artistName).then((artistInfoResult) => {
      console.log(artistInfoResult);
      createHTMLStructure(artistName, artistInfoResult.artistPic, artistInfoResult.artistBio, tracksList);
    });
  });
};

const getTrackLyrics = (trackId) => {
  return axios.get(trackLyricsUrl(trackId))
    .then(response => {
      return response.data.message.body.lyrics.lyrics_body;
    });
};

const main = document.getElementById('main');

const createHTMLStructure = (artistName, artistPic, artistBio, trackList) => {
  main.innerHTML = '';
  const sectionAuthor = createElement('section', "main__artist", main);
  sectionAuthor.setAttribute('id', 'section-author');

  createArtistHTMLStructure(artistName, artistPic, artistBio);
  createTrackListHTMLStructure(trackList);
};

const createArtistHTMLStructure = (artistName, artistPic, artistBio) => {
  const sectionAuthor = document.getElementById('section-author');
  sectionAuthor.innerHTML = '';

  const imgAuthor = createElement('img', "main__artist__image main__artist__image--downloaded", sectionAuthor);
  imgAuthor.setAttribute("alt", artistName);
  imgAuthor.setAttribute("src", artistPic);
  const hArtistName = createElement('h2', "main__artist__name", sectionAuthor);
  hArtistName.innerHTML = artistName;
  const pArtistBio = createElement('p', "main__artist__info", sectionAuthor);
  pArtistBio.innerHTML = artistBio;
};

const createTrackListHTMLStructure = (trackList) => {
  const sectionTracks = createElement('section', "main__tracks", main);
  const olTracks = createElement('ol', "main__tracks__list", sectionTracks);
  trackList.forEach(x => {
    const liTrack = createElement('li', "main__tracks__list__item", olTracks);
    liTrack.onclick = () => {
      showTrackLyrics(liTrack, x.trackId);
      updateArtist(x.artistName);
    }
    const hTrack = createElement('h4', "main__tracks__list__item__name", liTrack);
    hTrack.innerHTML = `${x.trackName} (${x.albumName})`;
    const divTrackLikes = createElement('div', "main__tracks__list__item__likes", liTrack);
    const imgLike = createElement('img', "like-image", divTrackLikes);
    imgLike.setAttribute("alt", "like");
    imgLike.setAttribute("src", "images/like.svg");
    const pLikesNumber = createElement('p', "likes-number", divTrackLikes);
    pLikesNumber.innerHTML = x.likesNumber;
  });
};

const createElement = (element, classCSS, parent) => {
  const tag = document.createElement(element);
  tag.setAttribute("class", classCSS);
  parent.appendChild(tag);
  return tag;
};

const showTrackLyrics = (liTrack, trackId) => {
  const lyrics = [...document.getElementsByClassName("main__tracks__list__item__lyrics")];
  lyrics.forEach(x => x.remove());

  const pTrack = createElement('p', "main__tracks__list__item__lyrics", liTrack);
  getTrackLyrics(trackId).then((lyrics) => {
    pTrack.innerHTML = lyrics;
  });
};

const updateArtist = (artistName) => {
  getArtistInfo(artistName).then((info) => {
    createArtistHTMLStructure(artistName, info.artistPic, info.artistBio);
  });
};
