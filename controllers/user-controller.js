const { User, Thought } = require('../models');

const UserController = {
  getAllUsers: (req, res) => {
    //GET all users
    User.find()
      .populate({ path: 'thoughts', select: '-username -reactions._id -__v' })
      .select('-__v')
      .then(data => {
        res.json(data);
      })
      .catch(err => {
        console.log(err);
        res.status(400).json(err);
      });
  },

  getUserById: ({ params }, res) => {
    //GET user by id
    User.findById(params.userId)
      .populate({ path: 'thoughts', select: '-username -reactions._id -__v' })
      .select('-__v -thoughts.reactions._id')
      .then(data => {
        if (!data) {
          return res.status(400).json({ message: 'Sorry, cannot find that ID' });
        }
        res.json(data);
      })
      .catch(err => {
        console.log(err);
        res.status(400).json(err);
      });
  },

  createUser: ({ body }, res) => {
    //Create User
    User.create(body)
      .then(data => res.json(data))
      .catch(err => res.status(400).json(err));
  },

  updateUser: ({ params, body }, res) => {
    //Update
    User.findByIdAndUpdate({ _id: params.userId }, body, { runValidators: true })
      .then(async data => {
        if (!data) {
          res.status(404).json({ message: 'Sorry, cannot find that ID' });
          return;
        }
        // update associated thoughts
        await Thought.updateMany({ username: data.username }, { username: body.username });
        // return updated user with its associated thoughts
        return User.findById(params.userId).populate('thoughts');
      })
      .then(data => res.json({ message: 'update successfully', data: data }))
      .catch(err => res.status(400).json(err));
  },

  deleteUser: ({ params }, res) => {
    //Delete User
    User.findOneAndDelete({ _id: params.userId })
      .select('-__v')
      .then(async data => {
        if (!data) {
          res.status(404).json({ message: 'Sorry, cannot find that ID' });
          return;
        }
        //Delete thoughts
        await Thought.deleteMany({ _id: { $in: data.thoughts } });
        res.json({ message: 'delete successfully', data });
      })
      .catch(err => res.status(400).json(err));
  },

  addFriend: ({ params }, res) => {
    //avoid adding yourself as friend
    if (params.userId === params.friendId) {
      res.status(404).json({ message: 'You need more friends than yourself!' });
      return;
    }
    //Add a friend
    User.findOneAndUpdate(
      { _id: params.userId },
      {
        $addToSet: {
          friends: params.friendId,
        },
      },
      { new: true, runValidators: true }
    )
      .then(data => {
        if (!data) {
          res.status(404).json({ message: 'Sorry, cannot find that ID' });
          return;
        }
        res.json(data);
      })
      .catch(err => res.json(err));
  },

  removeFriend: ({ params }, res) => {
    //Remove friend
    User.findOneAndUpdate(
      { _id: params.userId },
      {
        $pull: {
          friends: params.friendId,
        },
      },
      { new: true, runValidators: true }
    )
      .then(data => {
        if (!data) {
          res.status(404).json({ message: 'Sorry, cannot find that ID' });
          return;
        }
        res.json(data);
      })
      .catch(err => res.json(err));
  },
};

module.exports = UserController;