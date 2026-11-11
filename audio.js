export function crearAudio(botonSonido, estado) {
  const iconoSonido = `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z"/>
      <path d="M15 8a6 6 0 0 1 0 8"/>
      <path d="M18 5a10 10 0 0 1 0 14"/>
    </svg>
  `;

  const iconoMute = `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z"/>
      <path d="m16 9 5 6m0-6-5 6"/>
    </svg>
  `;

  const musica = new Audio(
    new URL('./assets/musica.mp3', import.meta.url).href
  );

  const timbre = new Audio(
    new URL('./assets/telefono.mp3', import.meta.url).href
  );

  const INICIO_MUSICA = 19;

  musica.loop = false;
  musica.volume = 0.12;
  musica.preload = 'metadata';
  musica.muted = true;

  timbre.volume = 0.75;
  timbre.preload = 'auto';
  timbre.muted = true;
  timbre.loop = true;


  let sonidoActivado = false;
  let sonidoElegido = false;
  let musicaPreparada = false;
  let musicaDeLlamada = false;
  let operacionSonido = 0;

  function prepararMusica() {
    if (musicaPreparada) return;

    if (
      Number.isFinite(musica.duration) &&
      musica.duration <= INICIO_MUSICA
    ) {
      throw new Error(
        'La música debe durar más de 19 segundos'
      );
    }

    musica.currentTime = INICIO_MUSICA;
    musicaPreparada = true;
  }

  musica.addEventListener('loadedmetadata', () => {
    try {
      if (
        !musicaPreparada ||
        musica.currentTime < INICIO_MUSICA
      ) {
        musicaPreparada = false;
        prepararMusica();
      }
    } catch {
      musica.pause();

      estado.textContent =
        'El archivo de música debe durar más de 19 segundos';
    }
  });

  function actualizarIconoSonido() {
    botonSonido.innerHTML = sonidoActivado
      ? iconoSonido
      : iconoMute;

    const etiqueta = sonidoActivado
      ? 'Silenciar sonido'
      : 'Activar sonido';

    botonSonido.title = etiqueta;
    botonSonido.setAttribute('aria-label', etiqueta);

    botonSonido.setAttribute(
      'aria-pressed',
      String(sonidoActivado)
    );
  }

  async function activarSonido() {
    const operacion = ++operacionSonido;

    sonidoActivado = true;
    musica.muted = false;
    timbre.muted = false;

    actualizarIconoSonido();

    if (!musicaDeLlamada) return;

    try {
      prepararMusica();
      await musica.play();

      if (
        operacion !== operacionSonido &&
        (!sonidoActivado || !musicaDeLlamada)
      ) {
        musica.pause();
      }
    } catch {
      if (operacion === operacionSonido) {
        estado.textContent =
          'No se pudo iniciar assets/musica.mp3';
      }
    }
  }

  function silenciarSonido() {
    operacionSonido++;
    sonidoActivado = false;

    musica.muted = true;
    timbre.muted = true;
    musica.pause();

    actualizarIconoSonido();
  }

  function activarPrimerSonido() {
    if (!sonidoElegido) {
      sonidoElegido = true;
      activarSonido();
    }
  }

  botonSonido.addEventListener('click', () => {
    sonidoElegido = true;

    if (sonidoActivado) {
      silenciarSonido();
    } else {
      activarSonido();
    }
  });

  function iniciarMusica() {
    musicaDeLlamada = true;
    musicaPreparada = false;
    if (sonidoActivado) activarSonido();
    else activarPrimerSonido();
  }

  function detenerMusica() {
    operacionSonido++;
    musicaDeLlamada = false;
    musica.pause();
  }

  musica.addEventListener('ended', detenerMusica);

  musica.addEventListener('error', () => {
    estado.textContent =
      'No se pudo cargar assets/musica.mp3';
  });

  let operacionTimbre = 0;
  let timbreActivo = false;

  async function reproducirTimbre() {
    const operacion = ++operacionTimbre;
    timbreActivo = true;
    timbre.muted = !sonidoActivado;
    try {
      timbre.currentTime = 0;
      await timbre.play();
      if (operacion !== operacionTimbre && !timbreActivo) timbre.pause();
    } catch {
      if (operacion === operacionTimbre) {
        estado.textContent = 'No se pudo reproducir el timbre. Podés atender igualmente.';
      }
    }
  }

  function detenerTimbre() {
    operacionTimbre++;
    timbreActivo = false;
    timbre.pause();
    timbre.currentTime = 0;
  }

  timbre.addEventListener('error', () => {
    if (timbreActivo) {
      estado.textContent = 'No se pudo cargar assets/telefono.mp3. Podés atender igualmente.';
    }
  });

  actualizarIconoSonido();

  return {
    activarPrimerSonido, silenciarSonido, reproducirTimbre, detenerTimbre,
    iniciarMusica, detenerMusica,
    get tiempoMusica() {
      if (musicaDeLlamada && !musica.muted && !musica.paused && !musica.ended && musica.readyState >= 2) {
        return musica.currentTime - INICIO_MUSICA;
      }
      return null;
    }
  };
}
