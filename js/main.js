const musixMatchKey = 'dd09d77faf4b4cfe40a00dd542b68f74';

let songsApiUrl = (option, text) => {
  let tempUrl = '';
  if (option == 'artist') {
   tempUrl = `q_artist=${text}`;
   } else {
    tempUrl = `q_track=${text}`
   }

   let url = `https://cors-anywhere.herokuapp.com/api.musixmatch.com/ws/1.1/track.search?${tempUrl}&page_size=5&page=1&s_track_rating=desc&apikey=${musixMatchKey}`.replace(/\s/g, '%20');
   return url;
}

let getApiSongData = (x) => {
  let songName = x.track.track_name;
  let albumName = x.track.album_name;
  let likesNumber = x.track.num_favourite;
  let songId = x. track.track_id;

  return {songName, albumName, likesNumber, songId};
}

let getSongInfo = (option, text) => {
  return axios.get(songsApiUrl(option, text)).then(response => {
    let artistName = response.data.message.body.track_list[0].track.artist_name;
    let songsList = response.data.message.body.track_list.map((x) => {
      return getApiSongData(x);
    })
    return {artistName, songsList};
  })
}

let getArtistInfo = (artistName) => {
  return axios.get(`https://cors-anywhere.herokuapp.com/en.wikipedia.org/w/api.php?format=json&action=query&prop=images|extracts&exintro&explaintext&redirects=1&titles=${artistName}`)
    .then(response => {
      let continueUrl = response.data.continue.imcontinue;
      let artistPic = `https://upload.wikimedia.org/wikipedia/commons/2/2f/${continueUrl.split('|')[1]}`;
      let wikiPages = Object.keys(response.data.query.pages)[0];
      let artistBio = response.data.query.pages[wikiPages].extract.split('\n')[0];
      return {artistPic, artistBio};
  });
}

document.getElementById('search-form').onsubmit = () => {
  const userOption = document.getElementById('select').value;
  const userText = document.getElementById('query').value;
  const songInfo = getSongInfo(userOption, userText);

  songInfo.then((songResult) => {
    console.log(songResult);
    getArtistInfo(songResult.artistName).then((artistInfoResult) => {
      console.log(artistInfoResult);
      createHTMLStructure(songResult.artistName, artistInfoResult.artistPic, artistInfoResult.artistBio, songResult.songsList);
    })
  })

  return false;
  }


let getSongLyrics = (songId) => {
  axios.get(`https://cors-anywhere.herokuapp.com/api.musixmatch.com/ws/1.1/track.lyrics.get?track_id=${songId}&apikey=${musixMatchKey}`)
    .then(response => {
      return response.body.lyrics.lyrics_body;
    })

}


const main = document.getElementById('main');

let createElement = (element, classCSS, parent = main) => {
  let tag = document.createElement(element);
  tag.setAttribute("class", classCSS);
  parent.appendChild(tag);
  return tag;
}

let createHTMLStructure = (artistName, artistPic, artistBio, songList) => {
  let sectionAuthor = createElement('section', "main__artist");
  let imgAuthor = createElement('img', "main__artist__image main__artist__image--downloaded", sectionAuthor);
  imgAuthor.setAttribute("alt", artistName);
  imgAuthor.setAttribute("src", artistPic);
  let hArtistName = createElement('h2', "main__artist__name", sectionAuthor);
  let pArtistBio = createElement('p', "main__artist__info", sectionAuthor);
  pArtistBio.innerHTML = artistBio;

  let sectionSongs = createElement('section', "main__songs");
  let olSongs = createElement('ol', "main__songs__list", sectionSongs);
  songList.forEach(x => {
    let liSong = createElement('li', "main__songs__list__item", olSongs);
    let hSong = createElement('h4', "main__songs__list__item__name", liSong);
    hSong.innerHTML = `${x.songName} (${x.albumName})`;
    let divSongLikes = createElement('div', "main__songs__list__item__likes", liSong);
    let imgLike = createElement('img', "like-image", divSongLikes);
    imgLike.setAttribute("alt", "like");
    imgLike.setAttribute("src", "images/like.svg");
    let pLikesNumber = createElement('p', "likes-number", divSongLikes);
    pLikesNumber.innerHTML = x.likesNumber;
  })
}


let songClick = (parent, x) => {
  let lyrics = document.getElementsByClassName("main__songs__list__item__lyrics");
  parent.removeChild(lyrics);

  let songId = x.songId;
  let pSong = createElement('p', "main__songs__list__item__lyrics", liSong);
  pSong.innerHTML = getSongLyrics(songId);
}
