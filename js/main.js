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

const getWikipediaImageUrl = (filename) => {
  return axios.get(`https://cors-anywhere.herokuapp.com/en.wikipedia.org/w/api.php?format=json&action=query&titles=Image:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url`)
    .then((response) => {
      const pages = Object.keys(response.data.query.pages)[0];
      return response.data.query.pages[pages].imageinfo[0].url;
    });
};

let getArtistInfo = (artistName) => {
  return axios.get(`https://cors-anywhere.herokuapp.com/en.wikipedia.org/w/api.php?format=json&action=query&prop=images|extracts&exintro&explaintext&redirects=1&titles=${artistName}`)
    .then(response => {
      const wikiPages = Object.keys(response.data.query.pages)[0];
      const page = response.data.query.pages[wikiPages];

      const eligibleImages = page.images.filter((x) => !x.title.includes('.svg') && !x.title.includes('.ogg'));
      const imageFilename = eligibleImages[Math.floor(Math.random() * eligibleImages.length)].title.slice(5); // drop "File:"

      return getWikipediaImageUrl(imageFilename).then((artistPic) => {
        let artistBio = page.extract.split('\n')[0];
        return {artistPic, artistBio};
      });
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
  return axios.get(`https://cors-anywhere.herokuapp.com/api.musixmatch.com/ws/1.1/track.lyrics.get?track_id=${songId}&apikey=${musixMatchKey}`)
    .then(response => {
      return response.data.message.body.lyrics.lyrics_body;
    });
}


const main = document.getElementById('main');

let createElement = (element, classCSS, parent = main) => {
  let tag = document.createElement(element);
  tag.setAttribute("class", classCSS);
  parent.appendChild(tag);
  return tag;
}

let createHTMLStructure = (artistName, artistPic, artistBio, songList) => {
  main.innerHTML = '';
  let sectionAuthor = createElement('section', "main__artist");
  let imgAuthor = createElement('img', "main__artist__image main__artist__image--downloaded", sectionAuthor);
  imgAuthor.setAttribute("alt", artistName);
  imgAuthor.setAttribute("src", artistPic);
  let hArtistName = createElement('h2', "main__artist__name", sectionAuthor);
  hArtistName.innerHTML = artistName;
  let pArtistBio = createElement('p', "main__artist__info", sectionAuthor);
  pArtistBio.innerHTML = artistBio;

  let sectionSongs = createElement('section', "main__songs");
  let olSongs = createElement('ol', "main__songs__list", sectionSongs);
  songList.forEach(x => {
    let liSong = createElement('li', "main__songs__list__item", olSongs);
    liSong.onclick = () => {
      showSongLyrics(liSong, x.songId);
    }
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

let showSongLyrics = (liSong, songId) => {
  let lyrics = [...document.getElementsByClassName("main__songs__list__item__lyrics")];
  lyrics.forEach(x => x.remove());
  // let parent = [...document.getElementsByClassName("main__songs__list__item")];
  // parent.forEach( x => x.removeChild(lyrics));

  let pSong = createElement('p', "main__songs__list__item__lyrics", liSong);
  getSongLyrics(songId).then((lyrics) => {
    pSong.innerHTML = lyrics;
  });
}
