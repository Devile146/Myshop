import { sampleProducts } from "./products.js";
import { firebaseConfig, firebaseIsConfigured } from "./firebase-config.js";

const categories = [
 ["Men's Wear","👔"],["Women's Wear","👗"],["Kids & Baby","🧸"],["Cosmetics","💄"],
 ["Perfumes","🧴"],["Bags & School Bags","🎒"],["Skincare","🧖"],["Jewellery","💍"],
 ["Caps & Accessories","🧢"],["Footwear","👟"],["Baby Care","🍼"],["Stationery","✏️"],
 ["General Store","🛍️"],["Home Essentials","🏠"]
];
let products = [...sampleProducts], activeCategory = "All", cart = [], activeProduct = null, chosenOption = "";
let firestore = null, firestoreReady = false;

const $ = id => document.getElementById(id);
const money = amount => "Rs. " + Number(amount || 0).toLocaleString("en-PK");
const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2500);
}
function renderCategories() {
  $("categoryGrid").innerHTML = categories.map(([name,icon]) => `
    <button class="category-card ${activeCategory===name?"active":""}" type="button" data-pick-category="${safe(name)}">
      <span class="category-icon">${icon}</span><span class="category-name">${safe(name)}</span>
    </button>`).join("");
}
function renderFilters() {
  const names = ["All", ...categories.map(c=>c[0])];
  $("filterRow").innerHTML = names.map(name => `<button type="button" class="filter-chip ${activeCategory===name?"active":""}" data-pick-category="${safe(name)}">${safe(name)}</button>`).join("");
}
function renderProducts() {
  const query = $("searchInput").value.trim().toLowerCase();
  const shown = products.filter(p => (activeCategory==="All" || p.category===activeCategory) &&
    (!query || `${p.name} ${p.category} ${p.description||""}`.toLowerCase().includes(query)));
  $("productHeading").textContent = activeCategory==="All" ? "Featured Products" : activeCategory;
  $("productGrid").innerHTML = shown.length ? shown.map(p => `
    <article class="product-card">
      <div class="product-photo" data-open-product="${safe(p.id)}" role="button" tabindex="0" aria-label="View ${safe(p.name)}">
        <img src="${safe(p.image)}" alt="${safe(p.name)}" loading="lazy">
        ${p.badge ? `<span class="product-badge">${safe(p.badge)}</span>` : ""}
        <button class="photo-open" type="button" data-open-product="${safe(p.id)}">View photo ↗</button>
      </div>
      <div class="product-info">
        <div class="product-category">${safe(p.category)}</div>
        <div class="product-name">${safe(p.name)}</div>
        <div class="product-bottom"><div><span class="product-price">${money(p.price)}</span>${p.oldPrice?`<span class="product-old-price">${money(p.oldPrice)}</span>`:""}</div>
        <button class="add-button" type="button" data-add-product="${safe(p.id)}">＋ Add</button></div>
      </div>
    </article>`).join("") : `<div class="empty-state">No products found. Try another search or category.</div>`;
}
function setCategory(name) {
  activeCategory = name; renderCategories(); renderFilters(); renderProducts();
  $("products").scrollIntoView({behavior:"smooth",block:"start"});
}
function openProduct(id) {
  const p = products.find(item => String(item.id)===String(id)); if (!p) return;
  activeProduct=p; chosenOption="";
  $("modalImage").src=p.image; $("modalImage").alt=p.name;
  $("modalCategory").textContent=p.category; $("modalProductName").textContent=p.name;
  $("modalPrice").textContent=money(p.price); $("modalDescription").textContent=p.description||"";
  $("modalInfo").textContent=p.information||"Please contact the store for product details.";
  $("modalStock").textContent="Availability: "+(p.stock||"Confirm with store");
  const options=Array.isArray(p.options)?p.options:(Array.isArray(p.sizes)?p.sizes:[]);
  $("modalOptions").innerHTML=options.length?options.map(option=>`<button type="button" class="size-option" data-option="${safe(option)}">${safe(option)}</button>`).join(""):`<span class="stock-line">Ask the store for available options.</span>`;
  $("productModal").classList.add("open"); $("productModal").setAttribute("aria-hidden","false"); document.body.classList.add("modal-open");
}
function closeProduct() {
  $("productModal").classList.remove("open"); $("productModal").setAttribute("aria-hidden","true");
  if (!$("cartModal").classList.contains("open")) document.body.classList.remove("modal-open");
}
function addToCart(id, option="") {
  const p=products.find(item=>String(item.id)===String(id)); if(!p)return;
  const existing=cart.find(row=>String(row.id)===String(id)&&row.option===option);
  if(existing)existing.qty++;else cart.push({id:p.id,option,qty:1});
  updateCart(); toast(`${p.name} added to cart`);
}
function updateCart() {
  const count=cart.reduce((sum,row)=>sum+row.qty,0);
  $("cartCount").textContent=count; $("dockCartCount").textContent=count;
  const total=cart.reduce((sum,row)=>sum+(Number(products.find(p=>String(p.id)===String(row.id))?.price)||0)*row.qty,0);
  $("cartTotal").textContent=money(total);
  $("cartItems").innerHTML=cart.length?cart.map((row,index)=>{
    const p=products.find(item=>String(item.id)===String(row.id)); if(!p)return "";
    return `<div class="cart-line"><img src="${safe(p.image)}" alt=""><div><strong>${safe(p.name)}</strong><small>${row.option?safe(row.option)+" · ":""}Qty ${row.qty} · ${money(p.price*row.qty)}</small></div><button type="button" data-remove-cart="${index}">Remove</button></div>`;
  }).join(""):`<div class="empty-state">Your cart is empty. Add products to start shopping.</div>`;
}
function openCart() {
  updateCart(); $("cartModal").classList.add("open"); $("cartModal").setAttribute("aria-hidden","false"); document.body.classList.add("modal-open");
}
function closeCart() {
  $("cartModal").classList.remove("open"); $("cartModal").setAttribute("aria-hidden","true");
  if (!$("productModal").classList.contains("open")) document.body.classList.remove("modal-open");
}
function setActiveDock(target) {
  document.querySelectorAll(".dock-item").forEach(item=>item.classList.toggle("selected",item===target));
}
async function connectFirebase() {
  if(!firebaseIsConfigured) { $("orderStatus").textContent="Firebase setup is pending. Add your Firebase Web App config in js/firebase-config.js to activate online orders."; return; }
  try {
    const appSdk=await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const dbSdk=await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
    const app=appSdk.initializeApp(firebaseConfig);
    firestore=dbSdk.getFirestore(app); firestoreReady=true;
    $("orderStatus").textContent="Connected to the store database. Your order will be saved when submitted.";
    const snapshot=await dbSdk.getDocs(dbSdk.collection(firestore,"products"));
    if(!snapshot.empty) {
      products=snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).filter(p=>p.active!==false);
      renderProducts();
    }
  } catch(error) {
    console.error("Firebase connection:",error);
    $("orderStatus").textContent="Firebase could not connect. Check the project configuration and Firestore setup.";
  }
}
async function submitOrder(event) {
  event.preventDefault();
  if(!cart.length){toast("Your cart is empty.");return;}
  const form=new FormData(event.currentTarget);
  const customer={name:String(form.get("customerName")||"").trim(),phone:String(form.get("phone")||"").trim(),address:String(form.get("address")||"").trim(),note:String(form.get("note")||"").trim()};
  if(!customer.name||!customer.phone||!customer.address){toast("Please complete the required delivery details.");return;}
  const items=cart.map(row=>{
    const p=products.find(item=>String(item.id)===String(row.id));
    return {productId:String(row.id),name:p?.name||"Product",price:Number(p?.price)||0,option:row.option,quantity:row.qty};
  });
  const total=items.reduce((sum,item)=>sum+item.price*item.quantity,0);
  const order={customer,items,total,status:"new",createdAt:new Date().toISOString(),source:"website"};
  if(!firestoreReady) {
    toast("Firebase is not configured yet. Add Firebase settings to enable order saving.");
    console.log("Preview order (not submitted to a server):",order);
    return;
  }
  try {
    const sdk=await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
    const result=await sdk.addDoc(sdk.collection(firestore,"orders"),order);
    $("orderStatus").textContent=`Order request saved. Reference: ${result.id}`;
    toast("Your order has been sent to the store.");
    cart=[]; updateCart(); event.currentTarget.reset();
  } catch(error) {
    console.error("Order submission:",error);
    toast("Order could not be saved. Please try again later.");
  }
}
document.addEventListener("click",event=>{
  const category=event.target.closest("[data-pick-category]");
  if(category){setCategory(category.dataset.pickCategory);return;}
  const open=event.target.closest("[data-open-product]");
  if(open){openProduct(open.dataset.openProduct);return;}
  const add=event.target.closest("[data-add-product]");
  if(add){addToCart(add.dataset.addProduct);return;}
  const option=event.target.closest("[data-option]");
  if(option){chosenOption=option.dataset.option;document.querySelectorAll(".size-option").forEach(el=>el.classList.toggle("selected",el===option));return;}
  const remove=event.target.closest("[data-remove-cart]");
  if(remove){cart.splice(Number(remove.dataset.removeCart),1);updateCart();return;}
  if(event.target.closest("[data-close-product]"))closeProduct();
  if(event.target.closest("[data-close-cart]"))closeCart();
});
$("modalAddButton").addEventListener("click",()=>{if(activeProduct){addToCart(activeProduct.id,chosenOption);closeProduct();}});
$("searchForm").addEventListener("submit",event=>{event.preventDefault();renderProducts();$("products").scrollIntoView({behavior:"smooth"});});
$("searchInput").addEventListener("input",renderProducts);
$("allCategoriesButton").addEventListener("click",()=>setCategory("All"));
$("viewAllProducts").addEventListener("click",()=>setCategory("All"));
$("headerCartButton").addEventListener("click",openCart);
$("dockCartButton").addEventListener("click",openCart);
$("checkoutForm").addEventListener("submit",submitOrder);
$("ordersButton").addEventListener("click",()=>toast("Order lookup will be enabled with the store's order tracking setup."));
$("footerContact").addEventListener("click",event=>{event.preventDefault();toast("Store contact details will be added by the owner.");});
$("dockContact").addEventListener("click",event=>{event.preventDefault();toast("Store contact details will be added by the owner.");});
document.addEventListener("keydown",event=>{if(event.key==="Escape"){closeProduct();closeCart();}});
document.querySelectorAll(".dock-item[href]").forEach(link=>link.addEventListener("click",()=>setActiveDock(link)));
$("year").textContent=new Date().getFullYear();
renderCategories();renderFilters();renderProducts();updateCart();connectFirebase();
