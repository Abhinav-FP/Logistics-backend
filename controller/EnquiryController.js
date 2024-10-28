const EnquireModal = require("../model/Enquiry");
const catchAsync = require("../utils/catchAsync");
const emailTemplate = require("../emailTemplates/replyMessage");
const sendEmail = require("../utils/EmailMailler");
const { validationErrorResponse, errorResponse, successResponse } = require("../utils/ErrorHandling");

exports.EnquiryPost = catchAsync(async (req, res) => {
    // const userId = req?.User?._id;
    // if (!userId) {
    //     return res.status(400).json({
    //         status: false,
    //         message: "User information not found in the request or userId is undefined.",
    //     });
    // }

    const { email, name, message, eventname, event_type, attendees } = req.body;

    const record = new EnquireModal({
        email, name, message, eventname, event_type, attendees
    });

    const result = await record.save();
    if (result) {
        res.json({
            status: true,
            message: "You have been Enquiry successfully !!.",
        });
    } else {
        res.json({
            status: false,
            error: result,
            message: "Failed to Enquiry.",
        });
    }
});


exports.EnquiryGet = catchAsync(async (req, res, next) => {
    try {

        const Enquiryget = await EnquireModal.find({});
        res.status(200).json({
            data: Enquiryget,
            msg: "Enquiryget Get",
        });
    } catch (error) {
        res.status(500).json({
            msg: "Failed to fetch Enquiryget",
            error: error.message,
        });
    }
});


exports.EnquiryGetUser = catchAsync(async (req, res, next) => {
    try {
        const userId = req.User._id;
        const enquiries = await EnquireModal.find({ userId: userId }).populate({
            path: 'userId',
            select: "username email"
            //  model: 'User'
        });
        if (!enquiries || enquiries.length === 0) {
            return res.status(404).json({
                msg: "No enquiries found for this user",
            });
        }

        res.status(200).json({
            data: enquiries,
            msg: "Enquiries with user data fetched successfully",
        });
    } catch (error) {
        res.status(500).json({
            msg: "Failed to fetch enquiries",
            error: error.message,
        });
    }
});



exports.EnquiryUpdateStatus = catchAsync(async (req, res) => {
    try {
        const { _id, enquire_status } = req.body;
        if (!_id || !enquire_status) {
            return res.status(400).json({
                message: "enquire ID and status are required.",
                status: false,
            });
        }

        const Enquire = await EnquireModal.findById(_id);
        if (!Enquire) {
            return res.status(404).json({
                message: "EnquireModal not found",
                status: false,
            });
        }

        Enquire.enquire_status = enquire_status;
        await Enquire.save();

        res.status(200).json({
            message: `Enquiry status updated to ${enquire_status}`,
            status: true,
            data: Enquire,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
            status: false,
        });
    }
});






exports.EnquiryReply = async (req, res) => {
    const { _id, reply_message, enquire_status } = req.body;
    if (!_id || !reply_message || !enquire_status) {
        return validationErrorResponse(res, "All fields (Id, reply_message, enquire_status) are required.");
    }

    try {
        const enquiry = await EnquireModal.findById(_id);
        console.log("Enquiry found:", enquiry);
        if (!enquiry) {
            return errorResponse(res, 404, "Enquiry not found.");
        }
        const updatedEnquiry = await EnquireModal.findByIdAndUpdate(
            _id,
            {
                reply_message,
                enquire_status,
            },
            { new: true }
        );

        const subject = "Thank You for Your Enquiry";
        if (updatedEnquiry) {
            try {
                await sendEmail(updatedEnquiry.email, updatedEnquiry.name, reply_message, subject, emailTemplate);
            } catch (emailError) {
                console.error("Email sending failed:", emailError);
                return errorResponse(res, 500, "Failed to send email notification.");
            }

            return successResponse(res, "You have successfully replied to the enquiry!");
        } else {
            return errorResponse(res, 400, "No changes were made to the enquiry.");
        }
    } catch (error) {
        console.error("Error during enquiry reply:", error);
        return errorResponse(res, 500, "Failed to update the enquiry.");
    }
};

