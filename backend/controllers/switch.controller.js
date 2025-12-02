import Switch from "../models/switch.model.js";
import statusKeywords from "../utils/statusKeywords.js";

export const getAllSwitches = async (req, res, next) => {
  try {
    const switches = await Switch.find();

    res.status(200).json({
      status: statusKeywords.SUCCESS,
      data: { switches },
    });
  } catch (err) {
    return next({
      statusCode: 500,
      status: statusKeywords.ERROR,
      message: "Failed to retrieve switches",
    });
  }
};

export const addSwitch = async (req, res, next) => {
  try {
    // --- Uppercase serial numbers ---
    if (req.body.serialNumber)
      req.body.serialNumber = req.body.serialNumber.toUpperCase();
    if (req.body.oldSerialNumber)
      req.body.oldSerialNumber = req.body.oldSerialNumber.toUpperCase();
    if (req.body.newSerialNumber)
      req.body.newSerialNumber = req.body.newSerialNumber.toUpperCase();

    // === UPDATED SERIAL VALIDATION LOGIC ===
    const givenSerial =
      req.body.serialNumber ||
      req.body.newSerialNumber ||
      req.body.oldSerialNumber;

    if (givenSerial) {
      const matches = await Switch.find({
        $or: [
          { serialNumber: givenSerial },
          { oldSerialNumber: givenSerial },
          { newSerialNumber: givenSerial },
        ],
      });

      if (matches.length > 0) {
        for (const sw of matches) {
          // === CASE 1: Match is on oldSerialNumber BUT switch has a newSerialNumber → IGNORE ===
          if (
            sw.oldSerialNumber === givenSerial &&
            sw.newSerialNumber && // it has a new serial
            sw.newSerialNumber !== givenSerial // and that new serial is different than the given one
          ) {
            continue; // ignore this match completely
          }

          // === CASE 2: Any match where status is NOT fixed → BLOCK ===
          if (sw.status !== "fixed") {
            return next({
              statusCode: 400,
              status: statusKeywords.FAIL,
              message:
                "A switch with this serial number already exists and is not marked as fixed.",
            });
          }

          // === CASE 3: Status is fixed but not delivered → BLOCK ===
          if (!sw.deliveredStatus || sw.deliveredStatus === "not_delivered") {
            return next({
              statusCode: 400,
              status: statusKeywords.FAIL,
              message:
                "This serial number belongs to a fixed switch that is not delivered yet.",
            });
          }
        }
      }
    }

    // Only allow deliveredStatus when status = fixed
    if (req.body.status !== "fixed") delete req.body.deliveredStatus;

    const newSwitch = await Switch.create(req.body);

    res.status(201).json({
      status: statusKeywords.SUCCESS,
      data: { newSwitch },
    });
  } catch (err) {
    return next({
      statusCode: 500,
      status: statusKeywords.ERROR,
      message: err.message,
    });
  }
};

export const updateSwitch = async (req, res, next) => {
  try {
    const { uniqueKey } = req.params;

    if (!Object.keys(req.body).length) {
      return next({
        statusCode: 400,
        status: statusKeywords.FAIL,
        message: "Request body cannot be empty",
      });
    }

    // --- Uppercase serial numbers ---
    if (req.body.serialNumber)
      req.body.serialNumber = req.body.serialNumber.toUpperCase();
    if (req.body.oldSerialNumber)
      req.body.oldSerialNumber = req.body.oldSerialNumber.toUpperCase();
    if (req.body.newSerialNumber)
      req.body.newSerialNumber = req.body.newSerialNumber.toUpperCase();

    // --- Prepare serial checks ---
    const givenSerial =
      req.body.serialNumber ||
      req.body.newSerialNumber ||
      req.body.oldSerialNumber;

    if (givenSerial) {
      const matches = await Switch.find({
        $or: [
          { serialNumber: givenSerial },
          { oldSerialNumber: givenSerial },
          { newSerialNumber: givenSerial },
        ],
        uniqueKey: { $ne: uniqueKey },
      });

      if (matches.length > 0) {
        for (const sw of matches) {
          // === CASE 1: Match is on oldSerialNumber BUT switch has a newSerialNumber → IGNORE ===
          if (
            sw.oldSerialNumber === givenSerial &&
            sw.newSerialNumber && // it has a new serial
            sw.newSerialNumber !== givenSerial // and that new serial is different than the given one
          ) {
            continue; // ignore this match completely
          }

          // === CASE 2: Any match where status is NOT fixed → BLOCK ===
          if (sw.status !== "fixed") {
            return next({
              statusCode: 400,
              status: statusKeywords.FAIL,
              message:
                "A switch with this serial number already exists and is not marked as fixed.",
            });
          }

          // === CASE 3: Status is fixed but not delivered → BLOCK ===
          if (!sw.deliveredStatus || sw.deliveredStatus === "not_delivered") {
            return next({
              statusCode: 400,
              status: statusKeywords.FAIL,
              message:
                "This serial number belongs to a fixed switch that is not delivered yet.",
            });
          }

          // ✅ If fixed AND delivered → allowed
        }
      }
    }

    // --- Delivered status allowed only if status = fixed ---
    if (req.body.status !== "fixed") delete req.body.deliveredStatus;

    const replacedSwitch = await Switch.findOneAndReplace(
      { uniqueKey },
      req.body,
      { new: true, runValidators: true }
    );

    if (!replacedSwitch) {
      return next({
        statusCode: 404,
        status: statusKeywords.FAIL,
        message: "Switch not found",
      });
    }

    res.status(200).json({
      status: statusKeywords.SUCCESS,
      data: { replacedSwitch },
    });
  } catch (err) {
    return next({
      statusCode: 500,
      status: statusKeywords.ERROR,
      message: err.message,
    });
  }
};

export const deleteSwitch = async (req, res, next) => {
  try {
    const { uniqueKey } = req.params;

    const deletedSwitch = await Switch.findOneAndDelete({ uniqueKey });

    if (!deletedSwitch) {
      return next({
        statusCode: 404,
        status: statusKeywords.FAIL,
        message: "Switch not found",
      });
    }

    res.status(204).json({
      status: statusKeywords.SUCCESS,
      message: "Switch deleted successfully.",
    });
  } catch (err) {
    return next({
      statusCode: 500,
      status: statusKeywords.ERROR,
      message: err.message,
    });
  }
};

export const getFilteredSwitches = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, ...filters } = req.query;

    if (!status) {
      return next({
        statusCode: 400,
        status: statusKeywords.FAIL,
        message: "Status is required for filtered list",
      });
    }

    // Build query object
    const query = { status };

    // Handle provider=false special case
    if (filters.provider === "false") {
      query.provider = { $in: [null, ""] };
      delete filters.provider; // remove it so it's not added again
    }

    // Add other filters if they exist
    Object.assign(query, filters);

    const switches = await Switch.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Switch.countDocuments(query);

    res.status(200).json({
      status: statusKeywords.SUCCESS,
      data: {
        switches,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
        },
      },
    });
  } catch (err) {
    return next({
      statusCode: 500,
      status: statusKeywords.ERROR,
      message: err.message,
    });
  }
};

export const searchSwitch = async (req, res, next) => {
  try {
    const { field, value } = req.query;

    if (!field || !value) {
      return next({
        statusCode: 400,
        status: statusKeywords.FAIL,
        message: "Both 'field' and 'value' are required",
      });
    }

    const allowedFields = ["serialNumber", "uniqueKey"];
    if (!allowedFields.includes(field)) {
      return next({
        statusCode: 400,
        status: statusKeywords.FAIL,
        message: `Search by '${field}' is not supported`,
      });
    }

    let foundSwitch = null;

    if (field === "uniqueKey") {
      foundSwitch = await Switch.findOne({ [field]: Number(value) });
    } else if (field === "serialNumber") {
      // Search across all relevant fields
      foundSwitch = await Switch.find({
        $or: [
          { serialNumber: value },
          { oldSerialNumber: value },
          { newSerialNumber: value },
        ],
      });
    }

    if (!foundSwitch) {
      return next({
        statusCode: 404,
        status: statusKeywords.FAIL,
        message: "No switch found matching that criteria",
      });
    }

    res.status(200).json({
      status: statusKeywords.SUCCESS,
      data: { foundSwitch },
    });
  } catch (err) {
    return next({
      statusCode: 500,
      status: statusKeywords.ERROR,
      message: err.message,
    });
  }
};

export const getSwitchStats = async (req, res, next) => {
  try {
    const stats = await Switch.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]);

    const total = stats.reduce((acc, item) => acc + item.count, 0);

    const noProviderCount = await Switch.countDocuments({
      status: "fixed",
      $or: [{ provider: { $exists: false } }, { provider: "" }],
    });

    const deliveredCount = await Switch.countDocuments({
      status: "fixed",
      deliveredStatus: "delivered",
    });

    const notDeliveredCount = await Switch.countDocuments({
      status: "fixed",
      $or: [
        { deliveredStatus: "not_delivered" },
        { deliveredStatus: { $exists: false } },
        { deliveredStatus: "" },
      ],
    });

    res.status(200).json({
      status: statusKeywords.SUCCESS,
      data: {
        total,
        breakdown: stats,
        noProviderCount,
        notDeliveredCount,
        deliveredCount,
      },
    });
  } catch (err) {
    return next({
      statusCode: 500,
      status: statusKeywords.ERROR,
      message: err.message,
    });
  }
};
