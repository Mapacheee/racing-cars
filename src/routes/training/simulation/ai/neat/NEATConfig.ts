
import { Config } from 'neat-javascript';

export const neatConfig = new Config({
  inputSize: 6, 
  outputSize: 3, 
  activationFunction: 'Sigmoid',
  populationSize: 20,
  generations: 100,
  numOfElite: 4,
  survivalRate: 0.15,
});

export const FITNESS_CONFIG = {
    weights: {
        distance: 5.0,
        speed: 3.0,
        checkpoints: 15.0,
        collisionPenalty: -1.0,
        backwardPenalty: -0.5
    },
    maxValues: {
        distance: 500,
        speed: 20,
        checkpoints: 15
    }
};
