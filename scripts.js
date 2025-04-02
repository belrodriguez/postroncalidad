// Global variables for interactions and state
let videoClosing = false;
let audioPlayers = {};
let youtubeTimeout, youtubePlayer, youtubeContainer, openYouTubeButton;
let localVideo, videoContainer, popupOverlay, popup;

document.addEventListener("DOMContentLoaded", () => {
  // --- Revised Loading Sequence ---

  // Get elements for the loading sequence
  const loadingScreen = document.getElementById("loading-screen");
  const startScreen = document.getElementById("start-screen");
  const startButton = document.getElementById("start-button");
  const revealScreen = document.getElementById("reveal-screen");
  const revealContainer = document.getElementById("reveal-container");

  // New audio for the reveal sequence (adjust filename as needed)
  const revealAudio = new Audio("audio/intro.mp3");

  // Define coordinate data for the four reveal images.
  // Adjust these values to match your project.
  const revealPositions = {
    "reveal-img1": { x: 0, y: 0, width: 1920, height: 1097 },
    "reveal-img2": { x: 122, y: 136, width: 1594, height: 506 },
    "reveal-img3": { x: 576, y: 563, width: 384, height: 168 },
    "reveal-img4": { x: 327, y: 537, width: 1433, height: 472 }
  };

  // When start button is clicked, begin the reveal sequence
  startButton.addEventListener("click", () => {
    // Hide the start screen and show the reveal screen
    startScreen.style.display = "none";
    revealScreen.style.display = "flex";
    // Fade in the reveal screen
    revealScreen.style.opacity = 0;
    setTimeout(() => {
      revealScreen.style.transition = "opacity 1s ease";
      revealScreen.style.opacity = 1;
    }, 50);

    // Responsive positioning for the reveal images
    // Use the base dimensions from reveal-img1:
    const baseWidth = revealPositions["reveal-img1"].width;
    const baseHeight = revealPositions["reveal-img1"].height;
    // Instead of setting fixed px sizes, set values in percentages.
    ["reveal-img1", "reveal-img2", "reveal-img3", "reveal-img4"].forEach(id => {
      const img = document.getElementById(id);
      const pos = revealPositions[id];
      if (img && pos) {
        img.style.position = "absolute";
        img.style.left = (pos.x / baseWidth) * 100 + "%";
        img.style.top = (pos.y / baseHeight) * 100 + "%";
        img.style.width = (pos.width / baseWidth) * 100 + "%";
        img.style.height = (pos.height / baseHeight) * 100 + "%";
      }
    });

    // Play the reveal audio
    revealAudio.play().catch(e => console.log("Audio play error:", e));

    // Sequentially reveal each image (each delayed by 1 second)
    const revealImgs = [
      document.getElementById("reveal-img1"),
      document.getElementById("reveal-img2"),
      document.getElementById("reveal-img3"),
      document.getElementById("reveal-img4")
    ];
    revealImgs.forEach((img, index) => {
      setTimeout(() => {
        img.classList.add("visible");
      }, index * 1000); // delay (ms) per image
    });

    // Once the reveal audio finishes, fade out the entire loading screen
    revealAudio.addEventListener("ended", () => {
      loadingScreen.style.transition = "opacity 1s ease";
      loadingScreen.style.opacity = 0;
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      }, 1000);
    });
  });

  // --- End of Revised Loading Sequence ---

  // Initialize collage and interaction elements
  const collage = document.getElementById("collage");
  popupOverlay = document.getElementById("popup-overlay");
  popup = document.getElementById("popup");
  youtubeContainer = document.getElementById("youtube-container");
  youtubePlayer = document.getElementById("youtube-player");
  openYouTubeButton = document.getElementById("open-youtube");
  videoContainer = document.getElementById("video-container");
  localVideo = document.getElementById("local-video");

  // Close YouTube or video if clicking outside their containers
  document.addEventListener("click", (e) => {
    if (
      (youtubeContainer.style.display === "block" || videoContainer.style.display === "block") &&
      !youtubeContainer.contains(e.target) &&
      !videoContainer.contains(e.target)
    ) {
      youtubeContainer.style.display = "none";
      youtubePlayer.src = "";
      clearTimeout(youtubeTimeout);
      videoContainer.style.display = "none";
      localVideo.pause();
      localVideo.src = "";
      videoClosing = true;
      setTimeout(() => {
        videoClosing = false;
      }, 500); // blocks for 500ms (0.5 seconds) // Set flag so that this same click does not trigger image interaction
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  // Dismiss popup when clicking on overlay background
  popupOverlay.addEventListener("click", (e) => {
    if (e.target === popupOverlay) {
      popupOverlay.style.display = "none";
      popup.innerHTML = "";
    }
  });

  // YouTube and video close button handlers
  document.getElementById("close-youtube").addEventListener("click", () => {
    youtubeContainer.style.display = "none";
    youtubePlayer.src = "";
    clearTimeout(youtubeTimeout);
  });
  document.getElementById("close-video").addEventListener("click", () => {
    videoContainer.style.display = "none";
    localVideo.pause();
    localVideo.src = "";
  });
  openYouTubeButton.addEventListener("click", () => {
    window.open(openYouTubeButton.dataset.url, "_blank");
  });

  // Load collage images from images.json and arrange them using base dimensions
  fetch("images.json")
    .then(response => response.json())
    .then(images => {
      const baseWidth = 1390, baseHeight = 2500;
      images.forEach(image => {
        const img = document.createElement("img");
        img.src = `images/${image.filename}`;
        img.classList.add("layer");
        img.style.left = (image.x / baseWidth) * 100 + "%";
        img.style.top = (image.y / baseHeight) * 100 + "%";
        img.style.width = (image.width / baseWidth) * 100 + "%";
        img.style.height = (image.height / baseHeight) * 100 + "%";
        if (image.opacity !== undefined) img.style.opacity = image.opacity;
        if (image.visible === false) img.style.display = "none";
        img.myData = image;
        collage.appendChild(img);
      });
    })
    .catch(error => console.error("Error loading images:", error));

  // Handle click events on the collage for interactions
  collage.addEventListener("click", (e) => {
    if (videoClosing) {
      videoClosing = false;
      return;
    }
    const elems = document.elementsFromPoint(e.clientX, e.clientY);
    for (let elem of elems) {
      if (elem.tagName.toLowerCase() === "img" && elem.classList.contains("layer")) {
        if (!isTransparent(e, elem)) {
          const data = elem.myData;
          if (data) {
            if (data.zoom) {
              document.querySelectorAll(".layer").forEach(i => i.classList.remove("focused"));
              elem.classList.add("focused");
            }
            handleInteraction(data, elem);
          }
          break;
        }
      }
    }
  });
});

// Utility: Check if the clicked pixel on an image is transparent
function isTransparent(e, img) {
  if (!img.complete || img.naturalWidth === 0) return false;
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const rect = img.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (img.naturalWidth / rect.width);
  const y = (e.clientY - rect.top) * (img.naturalHeight / rect.height);
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  return pixel[3] === 0;
}

// Utility: Convert a time string (e.g., "0:00" or "01:23:45") to seconds
function convertToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(timeStr);
}

// Process interaction actions (audio, video, redirect, YouTube, etc.)
function processAction(action, clickedImg) {
  if (action.type === "text") {
    // Clear previous popup content
    popup.innerHTML = "";
  
    // Main flex container for the image + text
    const container = document.createElement("div");
    container.classList.add("popup-content");
  
    // Image container
    const imgContainer = document.createElement("div");
    imgContainer.classList.add("popup-img-container");
  
    // Actual popup image
    const refImg = document.createElement("img");
    refImg.classList.add("popup-img");
    // Use popupImage if provided; otherwise, fallback to clicked image.
    refImg.src = action.popupImage ? `images/${action.popupImage}` : clickedImg.src;
  
    // If the action specifies enlargement, add a click handler to refImg:
    if (action.enlargePopupImage) {
      refImg.style.cursor = "pointer"; // indicate it's clickable
      refImg.addEventListener("click", () => {
        // Hide the current popup overlay.
        popupOverlay.style.display = "none";
  
        // Create a new overlay for the enlarged image.
        const enlargedOverlay = document.createElement("div");
        enlargedOverlay.style.position = "fixed";
        enlargedOverlay.style.top = 0;
        enlargedOverlay.style.left = 0;
        enlargedOverlay.style.width = "100vw";
        enlargedOverlay.style.height = "100vh";
        enlargedOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        enlargedOverlay.style.display = "flex";
        enlargedOverlay.style.alignItems = "center";
        enlargedOverlay.style.justifyContent = "center";
        enlargedOverlay.style.zIndex = "9999";
  
        // Create the enlarged image.
        const enlargedImg = document.createElement("img");
        enlargedImg.src = refImg.src;
        // Allow the image to show at its natural size up to a max.
        enlargedImg.style.maxWidth = "90%";
        enlargedImg.style.maxHeight = "90%";
        //enlargedImg.style.boxShadow = "0 0 20px rgba(0,255,255,0.8)"; // example glowing effect
        // (If you need a keyframe-based glow on the transparent edges, you can add that via CSS as well.)
        
        enlargedOverlay.appendChild(enlargedImg);
        document.body.appendChild(enlargedOverlay);
  
        // Clicking outside the enlarged image (on the overlay) will remove the enlarged overlay and show the popup again.
        enlargedOverlay.addEventListener("click", (e) => {
          if (e.target === enlargedOverlay) {
            document.body.removeChild(enlargedOverlay);
            popupOverlay.style.display = "flex";
          }
        });
      });
    }
  
    imgContainer.appendChild(refImg);
    container.appendChild(imgContainer);
  
    // Text container
    const textContainer = document.createElement("div");
    textContainer.classList.add("popup-text-container");
  
    // Optional popup title
    if (action.popupTitle) {
      const titleElem = document.createElement("h2");
      titleElem.innerText = action.popupTitle;
      if (action.popupTitleFont) titleElem.style.fontFamily = action.popupTitleFont;
      if (action.popupTitleSize) titleElem.style.fontSize = action.popupTitleSize;
      textContainer.appendChild(titleElem);
    }
  
    // Optional popup body
    if (action.popupBody) {
      const bodyElem = document.createElement("p");
      bodyElem.innerHTML = action.popupBody;
      if (action.popupBodyFont) bodyElem.style.fontFamily = action.popupBodyFont;
      if (action.popupBodySize) bodyElem.style.fontSize = action.popupBodySize;
      textContainer.appendChild(bodyElem);
    }
  
    // Fallback if no title/body specified
    if (!action.popupTitle && !action.popupBody) {
      const fallbackElem = document.createElement("div");
      fallbackElem.innerHTML = action.popupMessage ? action.popupMessage : action.content;
      textContainer.appendChild(fallbackElem);
    }
  
    container.appendChild(textContainer);
    popup.appendChild(container);
  
    // Finally, show the popup overlay.
    popupOverlay.style.display = "flex";
  
    // When clicking outside the popup content, close the popup (as before).
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        popupOverlay.style.display = "none";
        popup.innerHTML = "";
      }
    });
  } else if (action.type === "audio") {
    if (!audioPlayers[action.file]) audioPlayers[action.file] = new Audio(`audio/${action.file}`);
    const audio = audioPlayers[action.file];
    if (!audio.paused) { audio.pause(); audio.currentTime = 0; }
    else { audio.play(); }
  } else if (action.type === "youtube") {
    const startSec = convertToSeconds(action.startTime);
    youtubePlayer.src = `https://www.youtube.com/embed/${action.videoId}?start=${startSec}&autoplay=1&enablejsapi=1`;
    youtubeContainer.style.display = "block";
    if (action.endTime) {
      const duration = (convertToSeconds(action.endTime) - startSec) * 1000;
      youtubeTimeout = setTimeout(() => {
        youtubeContainer.style.display = "none";
        youtubePlayer.src = "";
      }, duration);
    }
  } else if (action.type === "video") {
    localVideo.src = `videos/${action.file}`;
    videoContainer.style.display = "block";
    localVideo.play();
  } else if (action.type === "redirect") {
    window.open(action.url, "_blank");
  } else if (action.type === "carousel3d") {
    // Dim the collage
    const collageElem = document.getElementById("collage");
    const dimOverlay = document.createElement("div");
    dimOverlay.className = "carousel3d-dim-overlay";
    collageElem.appendChild(dimOverlay);
  
    // Create the carousel container (fixed and centered)
    const carouselContainer = document.createElement("div");
    carouselContainer.className = "carousel3d-container";
    document.body.appendChild(carouselContainer);
  
    // If a title is provided, create and append it
    if (action.title) {
      const titleElem = document.createElement("div");
      titleElem.className = "carousel3d-title";
      titleElem.innerText = action.title;
      carouselContainer.appendChild(titleElem);
    }
  
    // Create the inner container to hold the cards
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "carousel3d-inner";
    carouselContainer.appendChild(cardsContainer);
  
    // Create caption container (for the active card’s caption)
    const captionElem = document.createElement("div");
    captionElem.className = "carousel3d-caption";
    carouselContainer.appendChild(captionElem);
  
    // Build card elements from the provided cards data
    let cardsData = action.cards; // each card: {src, title (optional), caption}
    let currentIndex = 0;
    cardsData.forEach((cardData, i) => {
      const card = document.createElement("div");
      card.className = "carousel3d-card";
      card.setAttribute("data-index", i);
  
      const img = document.createElement("img");
      img.src = `images/${cardData.src}`;
      img.className = "carousel3d-card-img";
      card.appendChild(img);
  
      // Optionally add a title to the card
      if (cardData.title) {
        const cardTitle = document.createElement("div");
        cardTitle.className = "carousel3d-card-title";
        cardTitle.innerText = cardData.title;
        card.appendChild(cardTitle);
      }
  
      cardsContainer.appendChild(card);
  
      // Clicking a card brings it to the center
      card.addEventListener("click", () => {
        currentIndex = i;
        updateCarousel3d();
      });
    });
  
    // Function to update positions of cards in a coverflow perspective
    function updateCarousel3d() {
      const cards = document.querySelectorAll(".carousel3d-card");
      const total = cards.length;
      cards.forEach((card, i) => {
        let offset = i - currentIndex;
        // Wrap around if necessary (optional)
        if (offset < -Math.floor(total / 2)) offset += total;
        if (offset > Math.floor(total / 2)) offset -= total;
        const offsetAbs = Math.abs(offset);
  
        // Adjust these values to fine-tune the effect:
        const spacing = 220;      // horizontal spacing between cards
        const rotate = -30;       // rotation per step (degrees)
        const zDepth = 150;       // depth offset per step
        const scaleFactor = 0.15; // scale reduction per step
  
        const translateX = offset * spacing;
        const rotateY = offset * rotate;
        const translateZ = -offsetAbs * zDepth;
        const scale = 1 - offsetAbs * scaleFactor;
  
        card.style.transform = `
          translate(-50%, -50%)
          translateX(${translateX}px)
          translateZ(${translateZ}px)
          rotateY(${rotateY}deg)
          scale(${scale})
        `;
        // Optionally fade out cards that are too far away
        card.style.opacity = offsetAbs > 2 ? 0.5 : 1;
        card.style.zIndex = 100 - offsetAbs;
      });
      // Update caption from the active card's data
      captionElem.innerText = cardsData[currentIndex].caption || "";
    }
  
    updateCarousel3d();
  
    // Close the carousel when the dim overlay is clicked
    function closeCarousel() {
      if (carouselContainer.parentNode) carouselContainer.parentNode.removeChild(carouselContainer);
      if (dimOverlay.parentNode) dimOverlay.parentNode.removeChild(dimOverlay);
    }
    dimOverlay.addEventListener("click", closeCarousel);
  }  
}

// Handle interactions triggered by clicking on an image
function handleInteraction(image, clickedImg) {
  if (!image.interaction) return;
  let actions = Array.isArray(image.interaction.actions)
    ? image.interaction.actions
    : [image.interaction];
  actions.forEach(action => {
    if (action.type === "showSubCollage") {
      showSubCollage();
    } else {
      processAction(action, clickedImg);
    }
  });
}

//Sub collage handling

window.showSubCollage = function() {
  const mainCollage = document.getElementById("main-collage");
  const subCollage = document.getElementById("sub-collage");

  // Make sub collage display immediately (but with opacity 0)
  subCollage.style.display = "block";
  
  // Start fading out the main collage
  mainCollage.style.opacity = "0";

  // When the main collage transition ends, hide it
  mainCollage.addEventListener("transitionend", function hideMain(e) {
    if (e.propertyName === "opacity") {
      mainCollage.style.display = "none";
      mainCollage.removeEventListener("transitionend", hideMain);
    }
  });

    // After a short delay, add the active class to sub collage so it fades in
    setTimeout(() => {
      subCollage.classList.add("active");
      loadSubCollageImages();
    }, 50); // a small delay to ensure the DOM registers the display change
  };

function loadSubCollageImages() {
  fetch("subimages.json")
    .then(response => response.json())
    .then(images => {
      const container = document.getElementById("sub-collage-images");
      container.innerHTML = ""; // Clear previous content if any
      images.forEach(image => {
        // Check your image path – if your sub collage images are in the "images" folder, update accordingly.
        const img = document.createElement("img");
        // If your images are in a subfolder (e.g., "images/board/"), keep that; otherwise, remove it.
        img.src = `images/board/${image.filename}`;
        img.classList.add("layer");
        const baseWidth = 2372, baseHeight = 1872;
        img.style.left = (image.x / baseWidth) * 100 + "%";
        img.style.top = (image.y / baseHeight) * 100 + "%";
        img.style.width = (image.width / baseWidth) * 100 + "%";
        img.style.height = (image.height / baseHeight) * 100 + "%";
        if (image.opacity !== undefined) img.style.opacity = image.opacity;
        if (image.visible === false) img.style.display = "none";
        img.myData = image;
        img.classList.add("sub-collage-img");
        // If the image should not intercept interactions, disable pointer events.
        if (image.disableInteraction) {
          img.style.pointerEvents = "none";
        } else {
          // Otherwise, add your click handler.
          img.addEventListener("click", (e) => {
            if (videoClosing) {
              videoClosing = false;
              return;
            }
            if (!isTransparent(e, img)) {
              const data = img.myData;
              if (data) {
                if (data.zoom) {
                  document.querySelectorAll(".sub-collage-img").forEach(i => i.classList.remove("focused"));
                  img.classList.add("focused");
                }
                handleInteraction(data, img);
              }
            }
          });
        }  
        container.appendChild(img);
      });
    })
    .catch(error => console.error("Error loading sub collage images:", error));
}
// Add event listener for the back button to return to the main collage
document.getElementById("back-button").addEventListener("click", () => {
  const mainCollage = document.getElementById("main-collage");
  const subCollage = document.getElementById("sub-collage");

  // Remove the active class to start fading out the sub collage
  subCollage.classList.remove("active");

  // When the sub collage transition ends, hide it and show the main collage
  subCollage.addEventListener("transitionend", function showMain(e) {
    if (e.propertyName === "opacity") {
      subCollage.style.display = "none";
      subCollage.removeEventListener("transitionend", showMain);
      mainCollage.style.display = "block";
      // Force reflow (optional) then fade in the main collage
      setTimeout(() => {
        mainCollage.style.opacity = "1";
      }, 50);
    }
  });
});