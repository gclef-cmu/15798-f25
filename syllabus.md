# Syllabus

- **Course**: CMU 15-798: Generative AI for Music and Audio
- **Meeting Days, Times, Location**: MW 12:30-1:50P GHC 4101
- **Semester**: Fall 2025
- **Units**: 12
- **Website**: https://gclef-cmu.github.io/15798-f25

## Instructor

- **Name**: [Professor Chris Donahue](https://chrisdonahue.com)
- **Contact**: Prefer [public Piazza posts](https://piazza.com/cmu/fall2025/15798) for general questions. Otherwise, email for private questions.
- **Office hours**: Wednesday 2-3p (right after class), Or by appointment
- **Office location**: GHC 7127

---

## Course Overview

This is a **graduate level course on generative AI taught through the lens of music and audio** taught by [Chris Donahue](https://chrisdonahue.com). We aim to study this topic _holistically_, covering everything from the **core ML methods** behind state-of-the-art music AI systems such as [Suno](https://suno.com), to principles of **interaction** with music AI systems, to the **broader societal implications** of music AI.

Methods for generative AI are increasingly consolidating across modalities. Our focus here will be on the domain-specific application of generative AI to music and audio, though many of the skills you learn will transfer to other modalities such as speech, images, video, or even text. A key focus will also be on writing and oral communication skills in research, which will transfer to any other research pursuit.

This is the first time this course has been offered. **Expect some bumps in the road!** Your instructor values candid feedback, so please feel free to [provide anonymous feedback at any time](https://forms.gle/7918wxczytxWu67G9). There will also be an opportunity on Oct 6 to provide anonymous/collective feedback through a session with a representative from CMU's Eberly Center.

### Major activities for the course include

See the [activities](./activities) page for more details.

**Engaging with research papers:**

- Reading and writing reflections for 20+ research papers
- Participating in in-class discussions for 30+ papers
- Leading a presentation on 2 research papers
- Submitting peer feedback on presentations you attend

**Completing Python/PyTorch-based assignments** that will task you to:

- Train a music audio generation systems using latent diffusion
- Train symbolic music generation systems using language models
- Repurpose representations from a music audio generation system for music classification tasks

**Conducting original research in generative AI for music and audio:**

- Propose and execute on an original research project
- Write a 6+ page paper on your research efforts
- Present your research to your peers and participate in a single-blind peer reviewing process

## Prerequisites

- Graduate students in SCS and ECE are admitted without prerequisites, although relevant background coursework is recommended (see below).
- Other students who have already conducted related research or have relevant background coursework may be admitted at instructor discretion.

**(Informal)** To succeed in the course, it is encouraged that all students have previously taken courses in: AI/ML, deep learning, signal processing, software engineering or programming (especially Python), and algorithms. We will assume background knowledge on fundamental generative AI topics like deep learning architectures and backpropagation.

It is also recommended that students have at least some background knowledge in music (e.g., can play an instrument and read sheet music) or coursework in computer music (e.g., took 15-322/622 at CMU).

## Learning Objectives

By the end of the semester, students will be able to:

- Understand the inner workings of state-of-the-art generative AI systems for music, audio, and beyond
- Engage with AI research at a scholarly level through written and oral argument
- Implement, train, and evaluate modern generative AI systems at small scales
- Conduct original research in generative AI for music and audio

These skills are designed to help you conduct original research in generative AI for multimedia like music, audio, and even language, images or video (many of the methods in generative AI are now standardized across modalities). Such research may be published in music-specific venues (ISMIR, ICASSP, NIME, ICMC, CMJ, etc.) or general AI venues (NeurIPS, ICML, ICLR, etc.). Your participation in writing reflections and oral discussions on research papers will also help strengthen your general writing and speaking skills in research.

## Activities

You will be expected to complete

## Attendance

A discussion-oriented course like this is only productive if students are present and engage. Accordingly, **your attendance in class is _required_.** That said, **please do not come to class if you are ill**. Attendance will be monitored through peer feedback.

TODO

Sources for participation: Peer presentation feedback, attendance, self evaluation of discussion participation

## Peer feedback and support

…

## Grading

The final course grade will be calculated using the following categories:

| Assessment                               | Total Percentage of Grade |
| ---------------------------------------- | ------------------------- |
| Reading reflections (~4 per week)        | 20% [80% is 100% Rule]    |
| Paper presentations (2)                  | 10%                       |
| Peer presentation feedback (~4 per week) | 10% [80% is 100% Rule]    |
| Assignments (3)                          | 15%                       |
| Final project (3)                        | 20%                       |
| Final project peer review (3)            | 5%                        |
| Exams (2)                                | 20%                       |
| Participation                            | 10%                       |

Students will be assigned the following final letter grades, based on calculations coming from the course assessment section.

Do optional reading reflections for credit, to make up for ones you missed

**Note:** For Reading reflections and Peer presentation feedback, a student need only to participate in 80% of assigned material to score 100% on that assessment. A student who provides feedback on all of their classmate (ie, 100% of talks) would receive 125% for that assessment; a student who provides feedback on 60% of their classmates would receive 75% for that assessment.

| Grade | Percentage Interval |
| ----- | ------------------- |
| A     | 90-100%             |
| B     | 80-89.9%            |
| C     | 70-79.9%            |
| D     | 65-69.9%            |
| R (F) | < 65%               |

I reserve the right to adjust these intervals to be more generous, but promise I will not adjust them to be less so.

**Exception:** If you submit your class project to ICML, NeurIPS, ICLR, ISMIR, ICASSP, or similar venue (ask your instructor) before the end of 2025 and is accepted, you automatically get an A in the class (your instructor will retroactively change your grade if you did not get an A).

## Grading Policies

- **Late-work policy:** I do not accept late work or make-up work, unless you are experiencing an emergency or crisis. In this case I will be happy to work with your advisor, student services, or disability services to develop an ad-hoc make-up plan.
- **Incomplete policy:** My incomplete policy is the same as my policy for late work: incompletes will only be permitted as part of a make-up plan in collaboration with your advisor, student services, or disability services in case of crisis or emergency.
- **Attendance policy:** Attendance is not part of your grade.

## Learning Resources

- This class is writing and language-intensive. You will not be graded on the perfection of your English grammar, but you will be graded on the content, structure, clarity, and quality of your written arguments. The Student Academic Support Communication Center can help you with these skills: https://www.cmu.edu/gcc/
- As part of your class project, you may need additional resources like special hardware or AWS credits -- please talk to me about any special infrastructure you may need

## Other Course Policies

### Academic Integrity & Collaboration

Please talk with other people and share your thoughts and ideas! With the exception of the midterm and exams (which you will do alone, in class), everything in this course is collaborative.

- **For weekly write-ups:** you need to write this yourself, and give credit to others where you cite their ideas. You might include in your discussion something like: "I discussed this paper with my friend Ahmed. Ahmed thinks the results in the evaluation are insufficient because they do not include empirical traffic matrices, only simulated ones. I think it was unreasonable to expect such empirical data since it is hard for academics to acquire."
- **For class projects:** you will work in teams. You and your teammates may use any open source code for your project, and should solicit feedback on your presentation and whitepaper from friends and classmates. The core of your code and the entirety of your writeup should be written by you and your teammates.

### Accommodations for students with disabilities

If you have a disability and require accommodations, please contact Catherine Getchell, Director of Disability Resources, 412-268-6121, getchell@cmu.edu. If you have an accommodation letter from the Disability Resources office, I encourage you to discuss your accommodations and needs with me as early in the semester as possible. I will work with you to ensure that accommodations are provided as appropriate.

### Student wellness

As a student, you may experience a range of challenges that can interfere with learning, such as strained relationships, increased anxiety, substance use, feeling down, difficulty concentrating and/or lack of motivation. These mental health concerns or stressful events may diminish your academic performance and/or reduce your ability to participate in daily activities. CMU services are available, and treatment does work. You can learn more about confidential mental health services available on campus at: http://www.cmu.edu/counseling/. Support is always available (24/7) from Counseling and Psychological Services: 412-268-2922.

### Children in class (adapted from Dr. Melissa Cheyney's syllabus):

- All exclusively breastfeeding babies are welcome in class as often as is necessary.
- For older children and babies, I understand that unforeseen disruptions in childcare often put parents in the position of having to choose between missing class to stay home with a child and leaving him or her with someone you or the child does not feel comfortable with. While this is not meant to be a long-term childcare solution, occasionally bringing a child to class in order to cover gaps in care is perfectly acceptable.
- In all cases where babies and children come to class, I ask that you sit close to the door so that if your little one needs special attention and is disrupting learning for other students, you may step outside until their need has been met.

### In case of emergency

If you, a family member, or a close friend are experiencing an emergency or crisis: absolutely do not worry about contacting me until you are out of the storm! In collaboration with your advisor, students services, or disability resources, we will take care of getting your coursework back on track after the crisis has passed.

## Attribution

Elements of the course structure (and syllabus) for 15-798 are based on [Professor Justine Sherry](https://www.justinesherry.com/)'s [15-744: Graduate Computer Networks](https://computer-networks.github.io/15-744-sp24). Thank you Professor Sherry 🙏
