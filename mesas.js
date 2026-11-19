// ═══════════════════════════════════════════════════════════════
//  MESAS DE FLAMBAO · patrón semanal
//  Es lo ÚNICO que hay que tocar. Las fechas que salen en las landings
//  y en la Unit Table se calculan solas a partir de este patrón.
//
//  · dow  = día de la semana (1 lunes · 2 martes · 3 miércoles · 4 jueves · 5 viernes · 6 sábado · 0 domingo)
//  · hora = hora de la mesa (comida 14:00 · cena 20:00)
//  · El ORDEN de las categorías es el orden de los botones en la landing.
// ═══════════════════════════════════════════════════════════════
window.MESAS_CONFIG = {
  desde: '2026-11-23',     // primera fecha desde la que arrancan las mesas (antes de esa fecha no se ofrece ninguna)
  cuantas: 2,              // cuántas fechas próximas se enseñan por categoría (2 = esta semana y la siguiente)
  cierreHoras: 24,         // una mesa deja de ofrecerse X horas antes de empezar (0 = hasta que empiece)

  patron: {
    'Nuevos Comienzos':    [{ dow: 4, hora: '20:00' }],   // jueves cena
    'Conocer Gente Nueva': [{ dow: 3, hora: '20:00' }],   // miércoles cena
    'Abierto al Amor':     [{ dow: 5, hora: '20:00' }],   // viernes cena
    'Negocios':            [{ dow: 4, hora: '14:00' }]    // jueves comida
  },

  // Eventos fijos de un restaurante (UMusic): salen en gris pequeñito debajo del día y se pueden pulsar para ver la info.
  // dias: 3 miércoles · 4 jueves · 5 viernes. Solo las mesas de tarde/noche (desde 'desdeHora'), no la de la comida.
  eventosPorRestaurante: {
    umusic: { desdeHora: '18:00', dias: { 3: 'Música en Vivo', 4: 'Tutti Frutti Disco', 5: 'Cara-oke' } }
  },

  // MESAS ONLY GIRLS (solo chicas, categoría Conocer Gente Nueva) en brickell/onlygirls, pabblo/onlygirls, etc.
  // De momento SIN días (vacío): cuando los tengas, añade aquí el día y la hora, por ejemplo:
  //   onlyGirls: { patron: [{ dow: 5, hora: '20:00' }] }      // viernes cena
  // y las fechas se calculan solas, igual que arriba (mismas reglas de 'desde', 'cuantas', 'cierreHoras' y 'excepciones').
  // También puedes poner fechas sueltas (no se repiten cada semana): fechas: [{ fecha: 'AAAA-MM-DD', hora: 'HH:MM' }]
  onlyGirls: {
    patron: [],
    fechas: [
      { fecha: '2026-11-20', hora: '20:30' },   // viernes 20 nov, cena
      { fecha: '2026-11-21', hora: '20:30' }    // sábado 21 nov, cena
    ]
  },

  // Días sin mesas (festivos, etc.), en formato 'AAAA-MM-DD'. Ej: ['2026-12-25', '2027-01-01']
  excepciones: [],

  // Texto extra de una mesa concreta: 'AAAA-MM-DD|Categoría': { '*': para todos, pabblo: solo en Pabblo, … }
  notas: {
    '2026-11-26|Negocios': { '*': '(Emprendedores)', pabblo: '(Emprendedores de patio campus)' }
  }
};

// ── Cálculo de las próximas mesas (no hace falta tocar nada de aquí para abajo) ──
(function () {
  var C = window.MESAS_CONFIG;
  var DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function p2(n) { return (n < 10 ? '0' : '') + n; }

  // Hora actual en Madrid, como "UTC falso" (así se compara con las horas de las mesas sin líos de zona horaria)
  function ahoraMadrid() {
    var s = null;
    try { s = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' }); } catch (e) {}
    if (!s) { var d = new Date(); s = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); }
    var m = s.match(/(\d+)-(\d+)-(\d+)\D+(\d+):(\d+)/);
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  }

  var REST = ((window.location && location.pathname) || '').split('/').filter(Boolean)[0] || '';
  REST = REST.toLowerCase();
  var ahora = ahoraMadrid();
  var hoy = Math.floor(ahora / 86400000);
  var d0 = C.desde.split('-');
  var desde = Math.floor(Date.UTC(+d0[0], +d0[1] - 1, +d0[2]) / 86400000);
  var inicio = Math.max(hoy, desde);
  var res = {};

  Object.keys(C.patron).forEach(function (cat) {
    res[cat] = [];
    for (var n = 0; n < 150 && res[cat].length < C.cuantas; n++) {
      var dia = inicio + n;
      var f = new Date(dia * 86400000);
      var iso = f.getUTCFullYear() + '-' + p2(f.getUTCMonth() + 1) + '-' + p2(f.getUTCDate());
      if (C.excepciones.indexOf(iso) !== -1) continue;
      C.patron[cat].forEach(function (slot) {
        if (f.getUTCDay() !== slot.dow || res[cat].length >= C.cuantas) return;
        var h = slot.hora.split(':');
        var mesaMs = dia * 86400000 + (+h[0]) * 3600000 + (+h[1]) * 60000;
        if ((mesaMs - ahora) / 3600000 < C.cierreHoras) return;
        var item = { dia: DIAS[f.getUTCDay()] + ', ' + f.getUTCDate() + ' de ' + MESES[f.getUTCMonth()], hora: slot.hora, fecha: iso };
        var ev = C.eventosPorRestaurante && C.eventosPorRestaurante[REST];
        if (ev && ev.dias[f.getUTCDay()] && slot.hora >= ev.desdeHora) item.evento = ev.dias[f.getUTCDay()];
        var nt = C.notas[iso + '|' + cat];
        if (nt) { var t = nt[REST] || nt['*']; if (t) item.nota = t; }
        res[cat].push(item);
      });
    }
  });

  window.MESAS_PROXIMAS = res;

  // Mesas only girls: misma lógica, con su propio patrón (vacío = sin días)
  var og = [];
  var slotsG = (C.onlyGirls && C.onlyGirls.patron) || [];
  for (var m = 0; m < 150 && slotsG.length && og.length < C.cuantas; m++) {
    var diaG = inicio + m;
    var fG = new Date(diaG * 86400000);
    var isoG = fG.getUTCFullYear() + '-' + p2(fG.getUTCMonth() + 1) + '-' + p2(fG.getUTCDate());
    if (C.excepciones.indexOf(isoG) !== -1) continue;
    slotsG.forEach(function (slot) {
      if (fG.getUTCDay() !== slot.dow || og.length >= C.cuantas) return;
      var hG = slot.hora.split(':');
      var msG = diaG * 86400000 + (+hG[0]) * 3600000 + (+hG[1]) * 60000;
      if ((msG - ahora) / 3600000 < C.cierreHoras) return;
      og.push({ dia: DIAS[fG.getUTCDay()] + ', ' + fG.getUTCDate() + ' de ' + MESES[fG.getUTCMonth()], hora: slot.hora, fecha: isoG });
    });
  }
  // Fechas sueltas only girls (se ofrecen hasta 'cierreHoras' antes de empezar)
  ((C.onlyGirls && C.onlyGirls.fechas) || []).forEach(function (x) {
    var f = x.fecha.split('-'), h = x.hora.split(':');
    var dMs = Date.UTC(+f[0], +f[1] - 1, +f[2]);
    var ms = dMs + (+h[0]) * 3600000 + (+h[1]) * 60000;
    if (C.excepciones.indexOf(x.fecha) !== -1 || (ms - ahora) / 3600000 < C.cierreHoras) return;
    var fd = new Date(dMs);
    og.push({ dia: DIAS[fd.getUTCDay()] + ', ' + fd.getUTCDate() + ' de ' + MESES[fd.getUTCMonth()], hora: x.hora, fecha: x.fecha, _ms: ms });
  });
  og.sort(function (a, b) { return (a.fecha + a.hora) < (b.fecha + b.hora) ? -1 : 1; });
  window.MESAS_ONLY_GIRLS = og;
})();
