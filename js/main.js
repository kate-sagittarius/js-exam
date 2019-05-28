const musixMatchKey = 'dd09d77faf4b4cfe40a00dd542b68f74';

const corsProxyUrl = 'https://cors-anywhere.herokuapp.com';

const songsApiUrl = (option, text) => {
  const tempUrl = `q_${option}=${text}`;

  return `${corsProxyUrl}/api.musixmatch.com/ws/1.1/track.search?${tempUrl}&page_size=5&page=1&s_track_rating=desc&apikey=${musixMatchKey}`.replace(/\s/g, '%20');
}

const getApiSongData = (x) => {
  const {
    artist_name: artistName,
    track_name: songName,
    album_name: albumName,
    num_favourite: likesNumber,
    track_id: songId,
  } = x.track;
  return { artistName, songName, albumName, likesNumber, songId };
}

const getSongInfo = (option, text) => {
  return axios.get(songsApiUrl(option, text)).then(response => {
    return response.data.message.body.track_list.map((x) => getApiSongData(x))
  })
}

const getWikipediaImageUrl = (filename) => {
  return axios.get(`${corsProxyUrl}/en.wikipedia.org/w/api.php?format=json&action=query&titles=Image:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url`)
    .then((response) => {
      const pages = Object.keys(response.data.query.pages)[0];
      return response.data.query.pages[pages].imageinfo[0].url;
    });
};

const getArtistInfo = (artistName) => {
  return axios.get(`${corsProxyUrl}/en.wikipedia.org/w/api.php?format=json&action=query&prop=images|extracts&exintro&explaintext&redirects=1&titles=${artistName}`)
    .then(response => {
      const wikiPages = Object.keys(response.data.query.pages)[0];
      const page = response.data.query.pages[wikiPages];

      const eligibleImages = page.images.filter((x) => !x.title.includes('.svg') && !x.title.includes('.ogg'));
      const imageFilename = eligibleImages[Math.floor(Math.random() * eligibleImages.length)].title.slice(5); // drop "File:"

      return getWikipediaImageUrl(imageFilename).then((artistPic) => {
        const artistBio = page.extract.split('\n')[0];
        return {artistPic, artistBio};
      });
  });
}

document.getElementById('search-form').onsubmit = (event) => {
  event.preventDefault();

  const userOption = document.getElementById('select').value;
  const userText = document.getElementById('query').value;
  const songInfo = getSongInfo(userOption, userText);

  songInfo.then((songsList) => {
    console.log(songsList);
    const artistName = songsList[0].artistName;
    getArtistInfo(artistName).then((artistInfoResult) => {
      console.log(artistInfoResult);
      createHTMLStructure(artistName, artistInfoResult.artistPic, artistInfoResult.artistBio, songsList);
    })
  })
}


const getSongLyrics = (songId) => {
  return axios.get(`${corsProxyUrl}/api.musixmatch.com/ws/1.1/track.lyrics.get?track_id=${songId}&apikey=${musixMatchKey}`)
    .then(response => {
      return response.data.message.body.lyrics.lyrics_body;
    });
}


const main = document.getElementById('main');


const createHTMLStructure = (artistName, artistPic, artistBio, songList) => {
  main.innerHTML = '';

  createArtistHTMLStructure(artistName, artistPic, artistBio);
  createSongListHTMLStructure(songList);
};

const createArtistHTMLStructure = (artistName, artistPic, artistBio) => {
  const sectionAuthor = createElement('section', "main__artist");
  const imgAuthor = createElement('img', "main__artist__image main__artist__image--downloaded", sectionAuthor);
  imgAuthor.setAttribute("alt", artistName);
  imgAuthor.setAttribute("src", artistPic);
  const hArtistName = createElement('h2', "main__artist__name", sectionAuthor);
  hArtistName.innerHTML = artistName;
  const pArtistBio = createElement('p', "main__artist__info", sectionAuthor);
  pArtistBio.innerHTML = artistBio;
};

const createSongListHTMLStructure = (songList) => {
  const sectionSongs = createElement('section', "main__songs");
  const olSongs = createElement('ol', "main__songs__list", sectionSongs);
  songList.forEach(x => {
    const liSong = createElement('li', "main__songs__list__item", olSongs);
    liSong.onclick = () => {
      showSongLyrics(liSong, x.songId);
    }
    const hSong = createElement('h4', "main__songs__list__item__name", liSong);
    hSong.innerHTML = `${x.songName} (${x.albumName})`;
    const divSongLikes = createElement('div', "main__songs__list__item__likes", liSong);
    const imgLike = createElement('img', "like-image", divSongLikes);
    imgLike.setAttribute("alt", "like");
    imgLike.setAttribute("src", "images/like.svg");
    const pLikesNumber = createElement('p', "likes-number", divSongLikes);
    pLikesNumber.innerHTML = x.likesNumber;
  });
};

const createElement = (element, classCSS, parent = main) => {
  const tag = document.createElement(element);
  tag.setAttribute("class", classCSS);
  parent.appendChild(tag);
  return tag;
};

const showSongLyrics = (liSong, songId) => {
  const lyrics = [...document.getElementsByClassName("main__songs__list__item__lyrics")];
  lyrics.forEach(x => x.remove());

  const pSong = createElement('p', "main__songs__list__item__lyrics", liSong);
  getSongLyrics(songId).then((lyrics) => {
    pSong.innerHTML = lyrics;
  });
};

// const updateArtist = (artistName) => {
//   // get artist info
//   getArtistInfo(artistName).then((info) => {
//     // display artist info
//   });
// };
