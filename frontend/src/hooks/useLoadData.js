import { useDispatch, useSelector } from "react-redux";
import { getUserData } from "../https";
import { useEffect, useState } from "react";
import { removeUser, setUser } from "../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";

const useLoadData = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user.user);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getUserData();
        dispatch(setUser(data.data));
      } catch (error) {
        dispatch(removeUser());
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    // 🔥 Call API only if user is not already in redux
    if (!user) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [dispatch, navigate, user]);

  return isLoading;
};

export default useLoadData;