import Comments from "../models/commentModel.js";
import Posts from "../models/postModel.js";
import Users from "../models/userModel.js";

export const createPost = async (req, res, next) => {
  try {
    // grab the userID
    const { userId } = req.body.user;
    // grab the post content
    const { description, image } = req.body;

    if (!description) {
      next("You must provide a description");
      return;
    }

    // create post
    const post = await Posts.create({
      userId,
      description,
      image,
    });

    res.status(200).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getAllPosts = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    // grab search params if any
    const { search } = req.body;

    const user = await Users.findById(userId);

    // to ensure user post and friends post is listed before other post
    // get the friends list and convert to array
    const friends = user?.friends?.toString().split(",") ?? [];
    // push userId to the array list
    friends.push(userId);

    // define a query object to find/search -- non-case sensitive
    const searchPostQuery = {
      $or: [
        {
          description: { $regex: search, $options: "i" },
        },
      ],
    };

    const posts = await Posts.find(search ? searchPostQuery : {})
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl",
      })
      .sort({ _id: -1 });

    //   filter all posts and return posts belonging to friends first
    const friendsPosts = posts?.filter((post) => {
      return friends.includes(post?.userId?._id.toString());
    });
    const otherPosts = posts?.filter(
      (post) => !friends.includes(post?.userId?._id.toString())
    );

    let postsRes = null;
    // sort post response to display friends post first and then other posts
    if (friendsPosts?.length > 0) {
      // if friendPosts gt 0 show friendPosts otherwise friendsPosts first followed by otherPosts
      postsRes = search ? friendsPosts : [...friendsPosts, ...otherPosts];
    } else {
      postsRes = posts;
    }

    res
      .status(200)
      .json({ success: true, message: "successful", data: postsRes });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getSinglePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Posts.findById(id)
      .populate({
        path: "userId",
        select: "firstName lastName location, profileUrl",
      })
      //   may comment this part if query is too slow
      .populate({
        path: "comments",
        populate: {
          path: "replies.userId",
          select: "firstName lastName location profileUrl",
        },
      })
      .sort({ _id: 1 });

    res.status(200).json({
      success: true,
      message: "successful",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getUserPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Posts.find({ userId: id })
      .populate({
        path: "userId",
        select: "firstName lastName location, profileUrl",
      })
      .sort({ _id: 1 });

    if (!post) {
      return res
        .status(404)
        .json({ success: "failed", message: "post is not available" });
    }

    res.status(200).json({
      success: true,
      message: "successful",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const postComments = await Comments.find({ postId })
      .populate({
        path: "userId",
        select: "firstName lastName location, profileUrl",
      })
      .populate({
        path: "replies.userId",
        select: "firstName lastName location, profileUrl",
      })
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      message: "successful",
      data: postComments,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const likePost = async (req, res, next) => {
  try {
    const { userId } = req.body.user; // get the userId that want to trigger the like
    const { id } = req.params; // get postId

    const post = await Posts.findById(id); // find the post by Id in post collections

    // postIndex --pid - findIndex on post.likes array
    const index = post.likes.findIndex((pid) => pid === String(userId));

    if (index === -1) {
      // if user have not like the post before
      post.likes.push(userId);
    } else {
      // else remove user like from post.likes
      post.likes = post.likes.filter((pid) => pid !== String(userId));
    }
    // upsate the post collections with the newPost like status
    const newPost = await Posts.findByIdAndUpdate(id, post, { new: true });

    // send response to user
    res
      .status(200)
      .json({ success: true, message: "successful", data: newPost });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const likePostComment = async (req, res, next) => {
  try {
    const { userId } = req.body.user;

    //  grab id of the comments as weel of reply id
    const { id, rid } = req.params;
    console.log(rid);
    // check if the reply id is undefined or null or false
    if (rid === undefined || rid === null || rid === false) {
      // focus on the comment and not the id
      const comment = await Comments.findById({ _id: id });
      if (!comment) {
        return res.status(404).json({ message: "Original comment not found" });
      }

      const index = comment?.likes?.findIndex((el) => el === String(userId));

      // if user havent like the coment push userId
      if (index === -1) {
        comment.likes.push(userId);
      } else {
        // else filter out/remove user like from the comment
        comment.likes = comment.likes.filter((like) => like !== String(userId));
      }
      const updated = await Comments.findByIdAndUpdate(id, comment, {
        new: true,
      });
      res.status(201).json(updated);
    } else {
      // when rid is not undefined or null or false -- focus on the reply
      const replyComments = await Comments.findOne(
        { _id: id },
        { replies: { $elemMatch: { _id: rid } } }
      );

      const index = replyComments?.replies[0]?.likes.findIndex(
        (i) => i === String(userId)
      );
      if (index === -1) {
        replyComments.replies[0].likes.push(userId);
      } else {
        replyComments.replies[0].likes = replyComments.replies[0]?.likes.filter(
          (i) => i !== String(userId)
        );
      }

      const query = { _id: id, "replies._id": rid };
      const updated = {
        $set: {
          "replies.$.likes": replyComments.replies[0].likes,
        },
      };

      const result = await Comments.updateOne(query, updated, { new: true });
      res.status(201).json(result);
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const commentPost = async (req, res, next) => {
  try {
    const { comment, from } = req.body; //extract for comment collection
    const { userId } = req.body.user; //user id
    const { id } = req.params; // post id

    if (!comment || comment === " " || from === " " || !from) {
      return res.status(404).json({ message: "Comment is required." });
    }

    const newComment = new Comments({ comment, from, userId, postId: id });
    await newComment.save();

    // updating the post with comments id
    const post = await Posts.findById(id);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post is unavialable or has been deleted." });
    }
    post.comments.push(newComment._id);

    const updatedPost = await Posts.findByIdAndUpdate(id, post, { new: true });
    res.status(201).json(newComment);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const replyPostComment = async (req, res, next) => {
  //extracts fro reqeust body for comment collection
  const { comment, from, replyAt } = req.body;
  const { userId } = req.body.user; //user id
  const { id } = req.params; // post id

  // Validate required fields
  if (
    !comment ||
    !from ||
    !replyAt ||
    comment.trim() === "" ||
    from.trim() === "" ||
    replyAt.trim() === ""
  ) {
    return res
      .status(404)
      .json({ message: "Comment fields are required and cannnot be empty." });
  }

  try {
    // find comment itself by id for enable direct reply
    const commentInfo = await Comments.findById(id);
    if (!commentInfo) {
      return res
        .status(404)
        .json({ message: "Original comment has been deleted or unavailable." });
    }
    // push in new comment and entries into the comment reply
    commentInfo.replies.push({
      comment,
      replyAt,
      from,
      userId,
      created_At: Date.now(),
    });

    commentInfo.save();

    res.status(200).json(commentInfo);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params; // posts id
    await Posts.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
