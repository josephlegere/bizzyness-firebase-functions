const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.onInvoiceCreate_1 = functions.firestore
    .document('/invoices/{invoiceId}')
    .onCreate((snapshot, context) => {
        const invoiceId = context.params.invoiceId;
        console.log(`New Invoice ${invoiceId}`);

        const invoiceDetails = snapshot.data();
        const tenant = (invoiceDetails.tenant.split('/'))[1];
        const ref = admin.firestore().collection('tenant_invoices').doc(tenant);

        const increment = admin.firestore.FieldValue.increment(1);

        return ref
            .update({
                current_invoice: increment,
                next_invoice: increment,
                num_invoices: increment
            });
    });

exports.onInvoiceDelete = functions.firestore
    .document('/invoices/{invoiceId}')
    .onDelete(async (snapshot, context) => {
        const invoiceDetails = snapshot.data();
        let { tenant } = invoiceDetails;

        const tenantid = tenant.split('/')[1];
        const ref = admin.firestore().collection('tenant_invoices').doc(tenantid);

        let invoicesSnap = await admin.firestore().collection('invoices').where('tenant', '==', tenant).orderBy('invoice_code', 'desc').limit(1).get();

        if (!invoicesSnap.empty) {
            let invoices = invoicesSnap.docs;
            let { invoice_code } = invoices[0].data();

            return ref
                .update({
                    current_invoice: invoice_code,
                    next_invoice: invoice_code + 1,
                    num_invoices: invoices.length
                });
        }
        else {
            return ref
                .update({
                    current_invoice: 0,
                    next_invoice: 1,
                    num_invoices: 0
                });
        }
    });