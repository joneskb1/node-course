const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //get booked tour
  const tour = await Tour.findById(req.params.tourId);
  //create checkout session
  const session = await stripe.checkout.sessions.create({
    // about session
    payment_method_types: ['card'],
    mode: 'payment',
    //this URL ins't secure sending data in url
    // need to use stripe web hooks in production
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}&alert=booking`,
    //with web hooks:
    // success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    //prefill email in form
    customer_email: req.user.email,
    // to store in DB
    client_reference_id: req.params.tourId,
    //item being purchased
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            // change for prod
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  //send session
  res.status(200).json({
    status: 'success',
    session,
  });
});

//comment out this function everywhere when using webhooks
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // temp due to unsecure! ppl can make bookings w/o paying
  // need to use stripe web hooks in production
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  //create booking doc
  await Booking.create({ tour, user, price });
  //remove query from URL for security
  res.redirect(req.originalUrl.split('?')[0]);
});

const createBookingCheckoutWebhook = async (session) => {
  const tour = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email }).id;
  const price = session.line_items[0].price_data.unit_amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`webhook error": ${err.message}`);
  }

  if (event.type === 'checkout-session.completed') {
    createBookingCheckoutWebhook(event.data.object);
  }

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
