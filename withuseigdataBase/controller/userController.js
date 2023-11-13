const Users = require("./../models/userModels");

const filteObj = (obj, ...objectFileds) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (objectFileds.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await Users.find();
    res.status(200).json({
      status: "success",
      data: {
        users,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: res.message,
    });
  }
};

exports.updateMe = async (req, res) => {
  // 1) the user here doesn't have a permission to update the password and confirmPassword
  // so we need to check if the user try update them he or she will get and error
  if (req.body.password || req.body.confirmPassword) {
    res.status(401).json({
      message:
        "this route for not updating the password, please use /updateCurrentPassowrd",
    });
  }

  // 2)here we need to update the user data but there some restrections like user will have permssion to update name and email
  // so we need to filter the req.body if it contains other fields like role or expireRestToken
  const updateUser = await Users.findByIdAndUpdate(
    req.user.id,
    filteObj(req.body, "name", "email"),
    {
      new: true,
    }
  );

  res.status(201).json({
    user: updateUser,
  });
};

// that function will be in charge for change the active filed in the database to false
exports.deleteMe = async (req, res) => {
  try {
    //1) get the user form the collection and we need to implicit the active filed bcause we set it as false
    await Users.findById(req.user.id, { active: false });

    res.status(204).json({
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      data: error.message,
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    const user = await Users.findById(userId);
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};
