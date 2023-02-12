/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

// add script to html
const stripe = Stripe(
  'pk_test_51Ma5LBKDeS7fGsue09KtZYexvplqcwigGwKOsgT9PwdjQ0vPLCxQL7it6amdxqwSdQ0sONiVH505vB8OnfoCnn1y00lpZD2Mq2'
);

export const bookTour = async (tourId) => {
  try {
    // get checkout session from API
    const session = await axios(
      `http://localhost:3000/api/v1/booking/checkout-session/${tourId}`
    );
    // create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
