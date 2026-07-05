/*
  Sourjoe | Pass 2C revision - Public Entry & Guided Navigation
  04 July 2026

  This route intentionally has no standalone entry card, timer, auth, or preview state.
  It immediately opens the real Book in explicit Public Mode.  The normal-flow orientation
  panel is created in sjLearn.html so visitors never pass through a second cloud/modal.
*/
(function sourjoePublicRoute() {
  'use strict';

  var target = './sjLearn.html?mode=public';
  try {
    window.location.replace(target);
  } catch (error) {
    window.location.href = target;
  }
}());
