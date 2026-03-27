# DevOps Practices Applied in the FitTrack Project

---

## Introduction

When we started building FitTrack, a fitness tracking web application, we were mainly
focused on getting the features to work. Things like user registration, logging workouts,
setting goals, and tracking progress. We did not think much about how the code would be
managed properly, how it would be tested, or how it would be deployed and kept running.
As the project got bigger, we started running into real problems. Code was getting lost,
things were breaking, and we had no idea if the live app was even running half the time.
That is when we started applying DevOps practices. DevOps is basically a way of working
that combines development and operations together so that software can be built, tested,
and delivered more reliably and with less stress. In this essay we will describe five
problems we identified in our project and explain what DevOps practice we used to fix
each one and what difference it made.

---

## Problem 1: No Version Control

One of the first big problems we had was that there was no proper system to manage the
code. In the beginning we were just saving files and sometimes sending them to each other
through messages or copying manually. This was a serious problem because when two people
changed the same file, one person's work would just overwrite the other person's work
without any warning. There was also no history of what changed and when, so if something
broke we had no way to go back to an earlier version that was working.

The DevOps practice that solves this is version control. Version control is a system that
tracks every change made to the codebase over time and allows multiple people to work on
the same project without overwriting each other's work. It is one of the most basic and
important practices in software development and DevOps. According to Kim, Humble, Debois
and Willis in The DevOps Handbook (2016), version control is the foundation that almost
every other DevOps practice depends on. Without it, you cannot do automated testing,
automated deployments, or proper collaboration.

We set up a Git repository and hosted it on GitHub. Every change to the project now goes
through Git commits and is pushed to the shared repository on GitHub. This means we have
a full history of every change, we can see who changed what and why, and we can roll back
to any previous version if something goes wrong. It also made it possible to set up all
the other practices like CI/CD and automated deployments, because everything starts from
the code being in a central repository.

---

## Problem 2: Manual Testing Was Slow and Unreliable

After we had version control in place, the next problem we noticed was with testing. Every
time someone made a change to the backend, we would manually open the app and click
around to see if things were still working. This was slow, and we kept missing things. A
change that fixed one part of the app would sometimes break a different part, and we would
only find out much later when the bug was already buried under newer code. It made fixing
things really frustrating.

The DevOps practice we applied here is Continuous Integration, or CI. The idea behind CI
is that every time code is pushed to the repository, it is automatically built and tested
without anyone having to do it manually. Humble and Farley (2010) describe CI as one of
the most important practices for reducing integration errors and catching bugs early before
they become bigger problems. The earlier you catch a bug the cheaper and easier it is to
fix.

We set up a CI pipeline using GitHub Actions. We wrote a workflow file that runs
automatically on every push to the main branch. The pipeline installs all the Python
dependencies and then runs our pytest test suite which checks that all the API routes are
working correctly, including authentication, creating workouts, creating goals, and getting
stats. It also runs a second job that installs the Node.js dependencies and checks that
the React frontend builds without any errors. If either job fails, GitHub shows a red
cross on the commit and we know straight away something is wrong. This stopped us from
accidentally merging broken code and gave us much more confidence when making changes.

---

## Problem 3: Environment Inconsistency Between Machines

Even with testing in place, we had another problem. The app would work fine on one
computer but refuse to start on a different one. This happened because of differences in
Python versions, different versions of installed packages, or Node.js version differences.
We would spend a lot of time just trying to get the project running on a new machine
instead of actually working on features. When we tried to deploy to a server it was even
worse because the server environment was completely different from our local computers.

This is a very common problem and the DevOps solution is containerization using Docker.
Docker lets you package an application together with everything it needs to run, including
the correct runtime version, all libraries, and configuration, inside a container. This
container will behave exactly the same way on any machine that has Docker installed. As
explained in The DevOps Handbook, containerization removes the "works on my machine"
problem by making environments consistent and reproducible across development, testing,
and production.

We created a Dockerfile for the backend that starts from a slim Python 3.11 base image,
installs all the required packages from requirements.txt, copies the application code, and
then starts the app using Gunicorn which is a production-grade web server. We also created
a Dockerfile for the React frontend. Railway, the platform we use to host the backend,
automatically detects the Dockerfile and uses it to build and run the application. This
means the environment in production is exactly the same as what the Dockerfile defines,
and there are no surprises when deploying.

---

## Problem 4: Data Was Being Lost Every Time the Server Restarted

Once the app was deployed, we discovered a serious problem with the database. We were
using SQLite which stores all data in a single file on the server. Cloud platforms like
Railway reset the file system every time they redeploy the service or restart it. So every
time we pushed new code and the server restarted, all the users, workouts, and goals that
had been saved were completely gone. This is a critical problem for any application that
is supposed to store user data properly.

The DevOps practice here is using a proper managed database service as part of the
infrastructure. This connects to a broader idea of treating infrastructure as something
that should be reliable, persistent, and managed properly rather than just an afterthought.
A managed database runs independently from the application, so it is not affected when the
app restarts or redeploys. This is a key principle in building stable production systems.

We provisioned a PostgreSQL database through Railway's built-in database service. The
database has its own persistent storage that survives application restarts and
redeployments. We updated the backend code so that it checks for a DATABASE_URL
environment variable at startup. If the variable is present, the app connects to
PostgreSQL. If not, it falls back to SQLite for local development. This way developers
can still run the project easily on their own machines without needing PostgreSQL installed,
but in production the data is stored safely. We also had to fix a race condition where
two server workers were both trying to create the database tables at the same time on
startup, which we solved by using autocommit mode in PostgreSQL so each table creation
ran as its own independent transaction.

---

## Problem 5: No Monitoring — We Did Not Know When the App Went Down

The last problem we identified was that after the app was live, we had no visibility into
whether it was actually running. Cloud services can go down for various reasons like
memory issues, server restarts, or network problems. Without any monitoring in place, the
app could be offline for hours and nobody on the team would know until someone tried to
use it and complained. This is a basic reliability problem that affects any production
system.

The DevOps practice for this is monitoring and alerting. The idea is that you should
always have automated systems watching your application and notifying you immediately if
something goes wrong, rather than finding out from users. According to The DevOps
Handbook, proper monitoring and observability are essential for maintaining reliable
systems and are one of the core technical practices of DevOps. You cannot fix problems
that you do not know about.

We implemented monitoring using UptimeRobot, which is a free monitoring tool. We set it
up to send an HTTP request to our backend health check endpoint every five minutes. The
health endpoint is a simple API route that returns a JSON response with the service status
and current timestamp. If UptimeRobot does not get a successful response back, it
immediately sends an email alert. We also added the database type to the health response,
so we can confirm that PostgreSQL is connected and not just that the server is running.
Since setting this up the monitor has shown 100% uptime and we now always know the current
status of the application.

---

## Conclusion

Going through this project taught us that DevOps is not just a set of tools, it is a way
of thinking about how software should be built and maintained. Before we applied these
practices, we were dealing with lost code, broken changes nobody noticed, apps that worked
on one machine but not another, data disappearing after deployments, and no idea if the
site was even online. Each problem had a clear DevOps solution. Git and GitHub gave us
version control and collaboration. GitHub Actions gave us automated testing so broken code
never went unnoticed. Docker made our environments consistent everywhere. PostgreSQL gave
us a proper persistent database. And UptimeRobot gave us visibility into the health of
the running application. Together these five practices transformed a chaotic project into
something that is actually reliable and maintainable. The main thing we took away from
this experience is that thinking about DevOps early makes everything easier later, and
ignoring it creates problems that just keep getting bigger.

---

*Word count: approximately 1,380 words*
