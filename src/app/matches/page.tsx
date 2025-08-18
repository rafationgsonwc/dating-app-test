"use client";
import Navbar from "@/lib/components/Navbar";
import { useEffect, useState } from "react";
import AuthGuard from "../../lib/components/AuthGuard";
import { useAppContext } from "@/lib/context/useAppContext";
import Swal from "sweetalert2";

export default function Matches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: authUser } = useAppContext();

  const startChat = (matchedUserId: string) => {
    // Redirect to chat page
    window.location.href = `/chat?chatUserId=${matchedUserId}`;
  };

  const unmatchUser = (matchedUserId: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, unmatch!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Unmatching user...",
          text: "Please wait while we unmatch the user...",
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });
        try {
          const response = await fetch(`/api/unmatch-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: authUser.id,
              matchedUserId: matchedUserId, // fixed
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to unmatch user");
          }

          Swal.close();
          Swal.fire(
            "Unmatched!",
            "You have unmatched this user.",
            "success"
          ).then(() => {
            const newMatches = matches.filter(
              (match) => match.id !== matchedUserId
            );
            setMatches(newMatches);
          });
        } catch (error) {
          console.error(error);
          Swal.close();
          Swal.fire("Error!", "Something went wrong.", "error");
        }
      }
    });
  };

  useEffect(() => {
    const fetchMatches = async () => {
      if (!authUser) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/get-matches?userId=${authUser.id}`);
        const matchesData = await res.json();
        setMatches(matchesData);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchMatches();
  }, [authUser]);

  return (
    <>
      <AuthGuard />
      <div className="main-container">
        <Navbar />
        <h1>Matches</h1>
        <div className="matches-container">
          {loading ? (
            <div className="match-card">
              <div
                className="gradient-loading"
                style={{ width: "100%", height: "100%" }}
              ></div>
            </div>
          ) : matches.length > 0 ? (
            matches.map((match) => (
              <div key={match.id} className="match-card">
                <div className="match-card-image">
                  <img src={match.profilePicture} alt={match.name} />
                </div>
                <div
                  style={{
                    alignSelf: "flex-start",
                    padding: "10px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <h2>{match.name}</h2>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <button
                        type="button"
                        title="Unmatch User"
                        className="btn btn-danger"
                        onClick={() => unmatchUser(match.id)} // pass match.id
                      >
                        <i
                          className="la la-user-slash"
                          style={{ fontSize: "20px" }}
                        ></i>
                      </button>
                      <button
                        type="button"
                        title="Start Chat"
                        className="btn btn-primary"
                        onClick={() => startChat(match.id)} // pass match.id
                      >
                        <i
                          className="lab la-rocketchat"
                          style={{ fontSize: "20px" }}
                        ></i>
                      </button>
                    </div>
                  </div>
                  <p>
                    {match.birthdate
                      ? new Date().getFullYear() -
                        new Date(match.birthdate.seconds * 1000).getFullYear()
                      : "N/A"}{" "}
                    years old
                  </p>
                  <p>{match.aboutMe}</p>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                width: "100%",
              }}
            >
              <h1>No matches found</h1>
              <p>You don't have any matches yet.</p>
              <p>Keep swiping to find your perfect match!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
