if (document.readyState == 'loading') {
  document.addEventListner('DOMContentLoaded', ready);
} else {
  ready();
}

function ready() {
  // remove item form cart
  let removeButtons = document.getElementsByClassName('btn-danger');
  for (let i = 0; i < removeButtons.length; i++) {
    let button = removeButtons[i];
    button.addEventListener('click', removeCartItem);
  }

  // item quantity changed
  let quantity = document.getElementsByClassName('cart-quantity-input');
  for (let i = 0; i < quantity.length; i++) {
    quantity[i].addEventListener('change', quantityChanged);
  }

  // add item to cart
  let addToCartButtons = document.getElementsByClassName('shop-item-button');
  for (let i = 0; i < addToCartButtons.length; i++) {
    let button = addToCartButtons[i];
    button.addEventListener('click', addToCartClicked);
  }

  // purchase items in the cart
  document
    .getElementsByClassName('btn-purchase')[0]
    .addEventListener('click', purchaseClicked);
}

async function purchaseClicked() {
  let cartItems = document.getElementsByClassName('cart-items')[0];
  let cartRows = cartItems.getElementsByClassName('cart-row');
  if (cartRows.length == 0) {
    alert('Add some items to the cart for purchase.');
    return;
  }

  let isUser = await fetch('https://thegenerics.herokuapp.com/home/purchase');
  isUser = await isUser.json();
  if (isUser.login == false) {
    location.assign('https://thegenerics.herokuapp.com/auth/login');
    return;
  }

  alert('Thank you for your purchase');
  while (cartItems.hasChildNodes()) {
    cartItems.removeChild(cartItems.firstChild);
  }
  updateCartTotal();
}

async function addToCartClicked(event) {
  let addToCart = event.target,
    item = addToCart.parentElement.parentElement,
    itemTitle = item.getElementsByClassName('shop-item-title')[0].innerText;

  // If item already in the cart
  let cartItemsTitles = document.getElementsByClassName('cart-item-title');
  for (let i = 0; i < cartItemsTitles.length; i++) {
    if (cartItemsTitles[i].innerText == itemTitle) {
      alert('Item already in the cart.');
      return;
    }
  }

  let imageSrc = item.getElementsByClassName('shop-item-image')[0].src,
    price = item.getElementsByClassName('shop-item-price')[0].innerText;

  try {
    await fetch(
      `https://thegenerics.herokuapp.com/home/${itemTitle}/addToCart`
    );
  } catch (err) {
    console.log(err);
  }

  addItemToCart(itemTitle, imageSrc, price);
  updateCartTotal();
}

function addItemToCart(title, imageSrc, price) {
  let cartRow = document.createElement('div');
  cartRow.classList.add('cart-row');

  cartRow.innerHTML = `
  <div class="cart-item">
    <img
      class="cart-item-image"
      src="${imageSrc}"
      width="100"
      height="100"
    />
    <div class="cart-item-title">${title}</div>
  </div>
  <div class="cart-quantity">
    <div class="cart-price cart-col-2"> ${price}</div>
    <div><input class="cart-quantity-input cart-col-2" type="number" value="1" /> </div>
    <div><button class="btn btn-danger cart-col-2" type="button">REMOVE</button></div>
  </div>
`;

  let cartItems = document.getElementsByClassName('cart-items')[0];
  cartItems.append(cartRow);

  cartRow
    .getElementsByClassName('btn-danger')[0]
    .addEventListener('click', removeCartItem);

  cartRow
    .getElementsByClassName('cart-quantity-input')[0]
    .addEventListener('change', quantityChanged);
}

async function quantityChanged(event) {
  let quantity = event.target;
  if (isNaN(quantity.value) || quantity.value <= 0) {
    quantity.value = 1;
  }
  updateCartTotal();

  // send itemName to update quantity in the database
  let cartRow = quantity.parentElement.parentElement.parentElement,
    itemTitle = cartRow.getElementsByClassName('cart-item-title')[0].innerText;
  try {
    await fetch(
      `https://thegenerics.herokuapp.com/home/${itemTitle}/${quantity.value}`
    );
  } catch (err) {
    console.log(err);
  }
}

async function removeCartItem(event) {
  let removeButton = event.target,
    cartRow = removeButton.parentElement.parentElement.parentElement;
  let itemTitle =
    cartRow.getElementsByClassName('cart-item-title')[0].innerText;

  cartRow.remove();
  updateCartTotal();

  try {
    await fetch(
      `https://thegenerics.herokuapp.com/home/${itemTitle}/removeFromCart`
    );
  } catch (err) {
    console.log(err);
  }
}

function updateCartTotal() {
  let cartItems = document.getElementsByClassName('cart-items')[0];
  let cartRows = cartItems.getElementsByClassName('cart-row');
  let totalPrice = 0;

  for (let i = 0; i < cartRows.length; i++) {
    let price = cartRows[i].getElementsByClassName('cart-price')[0];
    let quantity = cartRows[i].getElementsByClassName('cart-quantity-input')[0]
      .value;
    totalPrice += parseFloat(price.innerText.replace('$', '')) * quantity;
  }
  document.getElementsByClassName('cart-total-price')[0].innerText =
    '$ ' + Math.round(totalPrice * 100) / 100;
}
