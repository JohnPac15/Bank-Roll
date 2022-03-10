// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'moneyData' and set it to version 1
const request = indexedDB.open("moneyData", 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  db.createObjectStore("moneyData", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;
  console.log("++++++++YEP++++++");

  // check if app is online, if yes run uploadMoneyData() function to send all local db data to api
  if (navigator.onLine) {
    uploadMoneyData();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode, "Nope it didnt work");
};

// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["moneyData"], "readwrite");

  // access the object store for `new_pizza`
  const moneyObjectStore = transaction.objectStore("moneyData");

  // add record to your store with add method
  moneyObjectStore.add(record);
}

function uploadMoneyData() {
  // open a transaction on your db
  const transaction = db.transaction(["moneyData"], "readwrite");

  // access your object store
  const moneyObjectStore = transaction.objectStore("moneyData");

  // get all records from store and set to a variable
  const getAll = moneyObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
        
        fetch("/api/transaction", {
            method: "POST",
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json"
              },
        })
        .then( response => response.json())
        .then(data => {

          if (data.message) {
            throw new Error(data);
          } else {
              console.log('Im in here!!')
              // open one more transaction
              const transaction = db.transaction(["moneyData"], "readwrite");
              // access the new_pizza object store
              const moneyObjectStore = transaction.objectStore("moneyData");
              // clear all items in your store
              moneyObjectStore.clear();

              alert("All saved transactions have been submitted!");
          }
        })
        .catch((err) => {
          console.log(err,'nope!!!!');
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadMoneyData);
