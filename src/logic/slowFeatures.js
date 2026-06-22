/* The slow-features / distractor trap — pure helpers.
   The JEPA objective rewards PREDICTABILITY, not usefulness. With no masking the
   encoder can minimize prediction loss by latching onto a slow, trivially
   predictable background and ignoring the task object: low loss, useless
   representation. Masking (target design) forces capacity onto the harder, useful
   content — usefulness climbs (and predictability dips, because the object is
   harder to predict than an inert background). No DOM, no React. */
import { clamp } from "../logic.js";

/* Fraction of encoder capacity spent on the task object (0..1). At masking 0 only
   a sliver (0.15) is on the object — the rest chases the easy background. */
export function focus(masking) {
  return clamp(0.15 + 0.8 * masking, 0, 1);
}

/* How predictable the thing the encoder is modeling is (0..1). At masking 0 it is
   modeling the slow background → trivially predictable (0.95). As masking forces
   it onto the harder object, predictability falls. */
export function predictability(masking) {
  return clamp(0.95 - 0.4 * masking, 0, 1);
}

/* Task usefulness = how much of the representation is actually about the object. */
export function usefulness(masking) {
  return focus(masking);
}
