-- CreateTable
CREATE TABLE "users" (
    "university_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "profile_image" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isVolunteer" BOOLEAN NOT NULL DEFAULT false,
    "isWishVolunteer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("university_id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "fromTime" TIME NOT NULL,
    "toTime" TIME NOT NULL,
    "eventVenue" TEXT NOT NULL,
    "banner_image" TEXT,
    "isSoftDelete" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_event" (
    "user_id" TEXT NOT NULL,
    "event_id" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "isParticipated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_event_pkey" PRIMARY KEY ("user_id","event_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "time" TIME NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_university_id_key" ON "users"("university_id");

-- AddForeignKey
ALTER TABLE "user_event" ADD CONSTRAINT "user_event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event" ADD CONSTRAINT "user_event_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;
