const express = require("express");
const router = express.Router();

// ==== 1. PUBLIC: Service Request ====
const  createRequest  = require("../controllers/requestController");
router.post("/request-service", createRequest);

// ==== 2. AUTH ====
const { loginUserBySlug } = require("../controllers/authController");
router.post("/login/:slug", loginUserBySlug);

// // ==== 3. COMPANY REGISTRATION ====

const {
    createCompany,
    createCompanyAdmin
} = require("../controllers/companyController");
const upload = require("../middlewares/upload");

router.post("/register/company", upload.single("logo"), createCompany);

router.post("/register/company-admin", createCompanyAdmin);

// ==== 4. OWNER DASHBOARD ====
const {
    getAllRequests,
    markRequestHandled,
    sendInvite,
    // registerOwner
     loginOwner,
     toggleCompanyStatus 
} = require("../controllers/ownerController");
// const uploadpro = require("../middlewares/multer");
const verifyOwner = require("../middlewares/verifyOwner");

router.get("/admin/requests", getAllRequests);
router.patch("/admin/request/:id/handled", markRequestHandled);
router.post("/admin/invite-company", sendInvite);
router.post("/owner/login", loginOwner);
router.patch("/owner/company/:slug/status", verifyOwner, toggleCompanyStatus);

// router.post("/owner/register", upload.single("profilePic"), registerOwner); // Temporary, only for first setup
// // ==== 5. USER MANAGEMENT ====
// const {
//     inviteUser,
//     getAllUsers,
//     updateUserStatus,
//     getMyDashboard
// } = require("./controllers/userController");
// router.post("/:slug/users/invite", inviteUser);
// router.get("/:slug/users", getAllUsers);
// router.patch("/:slug/user/:id/status", updateUserStatus);
// router.get("/:slug/dashboard", getMyDashboard);



//New route jab hum token se cheak karengay user ko k wo konsi company ka hy or usky role k hisab se usy ki dikhana hy

const { getMyDashboard ,updateUserSalary } = require("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");

router.get("/:slug/dashboard", verifyToken, getMyDashboard);
router.patch("/:slug/users/salary", verifyToken, updateUserSalary);

const { markAttendance , getMyAttendance } = require("../controllers/attendanceController");

router.post("/:slug/attendance/mark", verifyToken, markAttendance);
router.get("/:slug/attendance", verifyToken, getMyAttendance);

 //leaves route sary
const { applyLeave , updateLeaveStatus, getAllLeaveRequests } = require("../controllers/leaveController");

router.post("/:slug/leave/apply", verifyToken, applyLeave);
router.patch("/:slug/leaves/update", verifyToken, updateLeaveStatus);
router.get("/:slug/leaves/all", verifyToken, getAllLeaveRequests);

// // ==== 6. ATTENDANCE ====
// const {
//     markAttendance,
//     getMyAttendance
// } = require("./controllers/attendanceController");
// router.post("/:slug/attendance/mark", markAttendance);
// router.get("/:slug/attendance/me", getMyAttendance);

// // ==== 7. LEAVE SYSTEM ====
// const {
//     applyLeave,
//     getAllLeaves,
//     updateLeaveStatus
// } = require("./controllers/leaveController");
// router.post("/:slug/leave/apply", applyLeave);
// router.get("/:slug/leave/all", getAllLeaves);
// router.patch("/:slug/leave/:id/update", updateLeaveStatus);

// // ==== 8. NOTIFICATIONS ====
// const {
//     getUserNotifications,
//     markNotificationSeen
// } = require("./controllers/notificationController");
// router.get("/:slug/user/notifications", getUserNotifications);
// router.patch("/:slug/user/notification/:id/seen", markNotificationSeen);

// // ==== 9. JOB APPLICATIONS ====
// const {
//     applyJob,
//     getCompanyApplications
// } = require("./controllers/applicationController");
// router.post("/:slug/apply", applyJob);
// router.get("/:slug/applications", getCompanyApplications);

const uploadCV = require("../middlewares/upload");
const { applyForJob , getAllApplications ,updateApplicationStatus } = require("../controllers/applicationController");

router.post("/:slug/apply", uploadCV.single("resume"), applyForJob);
router.get("/:slug/applications", verifyToken, getAllApplications);

router.patch("/:slug/applications/status", verifyToken, updateApplicationStatus);


const { getAdminDashboard } = require("../controllers/dashboardController");

router.get("/:slug/dashboard", verifyToken, getAdminDashboard);




const {
  getMyNotifications,
  markNotificationRead
} = require("../controllers/notificationController");

router.get("/:slug/notifications", verifyToken, getMyNotifications);
router.patch("/:slug/notifications/:id/read", verifyToken, markNotificationRead);



module.exports = router;
