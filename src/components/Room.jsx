import React, { useState } from "react";
import Chat from "./Chat";
import ShareRoom from "./ShareRoom";
import "../styles/room.scss";

function Room({
    username,
    theme,
    onToggleTheme,
    roomMode,
    initialRoomId,
    onLeaveRoom,
    onJoinFailed,
    onRoomReady,
}) {
    const [roomId, setRoomId] = useState(initialRoomId || "");
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [myId, setMyId] = useState("");

    const handleRoomReady = (id) => {
        setRoomId(id);
        onRoomReady(id);
    };

    const isConnecting = !roomId;

    return (
        <div className="room-page">
            {/* Header */}
            <header className="room-header">
                <div className="room-header-info">
                    <h1 className="room-welcome">
                        Welcome, {username}!
                    </h1>

                    {isConnecting ? (
                        <p className="room-header-subtitle">
                            Setting up your room...
                        </p>
                    ) : (
                        <div className="room-header-room-info">
                            <div className="room-header-code">
                                <span className="room-header-code-label">
                                    Room Code
                                </span>

                                <span
                                    className="room-header-code-value"
                                    aria-label={`Room code ${roomId}`}
                                >
                                    {roomId}
                                </span>
                            </div>

                            <ShareRoom roomId={roomId} />
                        </div>
                    )}
                </div>

                <div className="room-header-actions">
                    <button
                        type="button"
                        className="leave-btn"
                        onClick={onLeaveRoom}
                    >
                        Leave
                    </button>

                    <button
                        type="button"
                        className="theme-btn"
                        onClick={onToggleTheme}
                        aria-label="Toggle theme"
                    >
                        {theme === "light" ? "🌙" : "🌞"}
                    </button>
                </div>
            </header>

            {/* Room Body */}
            <div className="room-body">
                {/* Online Users */}
                <aside className="room-sidebar">
                    <section className="room-panel">
                        <h2 className="room-panel-title">
                            Online
                            <span className="room-panel-count">
                                {onlineUsers.length}
                            </span>
                        </h2>

                        <ul className="room-users-list">
                            {onlineUsers.length === 0 && (
                                <li className="room-users-empty">
                                    Waiting for players...
                                </li>
                            )}

                            {onlineUsers.map((user) => (
                                <li
                                    key={user.id}
                                    className={`room-user${
                                        user.id === myId
                                            ? " room-user--you"
                                            : ""
                                    }`}
                                >
                                    <span
                                        className="room-user-status"
                                        aria-hidden="true"
                                    />

                                    <span className="room-user-name">
                                        {user.username}
                                    </span>

                                    {user.id === myId && (
                                        <span className="room-user-tag">
                                            You
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                </aside>

                {/* Chat */}
                <main className="room-main">
                    <Chat
                        key={`${roomMode}-${username}`}
                        username={username}
                        theme={theme}
                        roomMode={roomMode}
                        initialRoomId={initialRoomId}
                        onLeaveRoom={onLeaveRoom}
                        onJoinFailed={onJoinFailed}
                        onRoomReady={handleRoomReady}
                        onOnlineUsersUpdate={setOnlineUsers}
                        onSocketConnected={setMyId}
                        embedded
                    />
                </main>
            </div>
        </div>
    );
}

export default Room;