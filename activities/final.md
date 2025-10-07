# Final Project: Original Research

Over the second half of the semester, you will conduct original research, write up your results in a conference paper format, and participate in a mock peer review process.

You may work by yourself or **with up to one other student on this project**. If you work in a pair, you will be responsible for clearly specifying the division of labor in your work.

Your project topic must involve **music or audio AI** in some fashion, though you are welcome and encouraged to find the intersection between these topics and any other research areas you are interested in!

This project is designed to bring together all of the skills you have learned in this course to date and challenge you to plan and execute a music or audio AI research vision from start to finish!

Major deliverables include:

1. [A project proposal](#project-proposal)
1. [A 3-6 page paper](#paper)
1. [An in-class presentation](#presentation)
1. [Participation in peer review](#peer-review)

## Key Dates

Turn in all deliverables through [this form](https://forms.gle/hQDxkYV4kmd9dP4bA).

All due dates are 11:59PM Eastern on the day specified.

- **Fri Oct 24** 🪨: Project proposal
- **Fri Oct 31** 📜✨: Draft of related work section
- **Fri Nov 07** 📜✨: Draft of activities sections (e.g., methods and experimental descriptions)
- **Fri Nov 14** 📜✨: Draft of preliminary results
- **Fri Nov 21** 📜✨: Draft of intro, abstract, and Figure 1
- **Mon Dec 01** 🪨: Final project presentations (in class)
- **Wed Dec 03** 🪨: Final project presentations (in class)
- **Fri Dec 05** 🪨: Full paper due
- **Fri Dec 12** 🪨: Paper reviews due

Emoji legend:

- 📜 (draft sections): You should submit all draft sections using the [template](#template) below
- ✨: **Seven total grace days** can be used across all deadlines w/ this marking. You can use all on one deadline, or less than 7 on others.
- 🪨: **Hard deadline**, no grace days accepted. **Max half credit if hard deadline is missed**, see [grading](#grading).

## Project proposal

Your project proposal should be a "one-pager" (1-2 page PDF in any format) which effectively conveys the gist of your project idea.

Please include at least the following information in your proposal:

1. 1-2 sentence description of your **high level _goal_** (similar to the goal statements from the open ended sections of your assignments)
1. 1 paragraph describing the **motivation and background context** for your proposed project
1. 1-2 paragraphs summarizing your **concrete research plan**.
   1. What research activities do you plan to pursue (running ML experiments, conducting user interviews, surveying literature)? How will you pursue each in very specific terms?
   1. What specific resources (code libraries, pretrained models, datasets, papers, computing infrastructure) will you make use of?
   1. What are one or more precise _claims_ that you hope to be able to make at the conclusion of your project?
   1. How will you _evaluate_ your claims, i.e., how do you define success?
1. 1 paragraph summarizing the most **relevant work** you can find, w/ links to the relevant papers. You must included at least one paper on our schedule (or specifically mention why this project does not relate to any of the work we've discussed)
1. (_Optional, encouraged_) A **figure** illustrating your overall research idea
1. (_Required if working in a pair_) List of team members and the expected activities of each team member. **You will need to be very specific in describing how the work will be divided**.

After you submit your proposal, the course instructors will **provide you with feedback to help you refine your ideas and research activities**.

### Project ideation guidelines

Coming up with a research direction can be a challenging and nebulous process! With the goal of fostering a diverse set of independent projects in the class, I'll refrain from providing a list of low-level suggestions and instead offer some high-level guidance below.

If you are uncertain about your direction for any reason (not sure if an idea is ambitious enough, difficulty choosing between N ideas, struggling to come up with any ideas), you are encouraged to **send me an email in advance of the proposal deadline**.

High-level guidance on project ideation:

1. When in doubt, _narrow your scope_. In research you want to be ambitious, though for this class project, I would **strongly prefer to see conclusive answers to narrowly-scoped scientific questions** as opposed to incomplete answers to broadly-scoped questions.
1. **Think carefully through computing resource constraints**! There are significant limitations to what you can do w/ 100 GPU credits on Colab Pro. You are welcome to use other computing resources if you have access to them, but if you are limited to Colab, please factor this into your project ideation.
1. **Supervised learning is your friend!** Generative modeling is flashy and fun but quite challenging. I started my research career with a [discrimantive, supervised learning](https://arxiv.org/abs/1703.06891) task before confronting anything generative.
1. **Pretrained models are your friend!** Our computational resources in this class are _very_ limited. You do not have the resources to train a state-of-the-art music generation model, though you may have the resources to [add a new control capability to a pre-trained model](https://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=10536191), or [design a novel use case for a pre-trained model](https://arxiv.org/pdf/2411.09625)
1. **Synthetic data is your friend!** Evaluation in music is often quite difficult, but through synthetic data, you can [turn nebulous, subjective concepts into objective evaluations](https://arxiv.org/abs/2503.16669).
1. **Consider benchmarks or data collection efforts**! These are often well-scoped / high-impact research contributions that don't require a lot of compute.
1. For this course, your final project **does not have to be completely novel**. E.g., you can reimplement existing methods in a new framework or reproduce results from past work. Though, all of your code and writing is expected to be original work.
1. Some **potential sources of project ideas** may come from:
   1. A curiosity or unanswered question you encountered when reading a paper in the course
   1. An extension to one of the open ended explorations from your assignments
   1. The list of low-level project ideas associated w/ each assignment
   1. Browsing the [ISMIR accepted paper titles for 2025](https://ismir2025.ismir.net/program-accepted-papers) or [full proceedings from past years w/ paper PDFs](https://ismir.net/conferences)
   1. Browsing Google Scholar on a topic from our [schedule](https://docs.google.com/spreadsheets/d/12Kafr6aprZ4euIV9A94T6k2lGxY6Tak4X1Se9j-9NcI/edit?gid=0#gid=0) that you find interesting, even if we have not covered it yet
   1. A music AI research problem specific to your personal musical practice
1. Instead of typical music AI research methods (designing new methods, training models, running experiments, evaluating, etc.), you may also choose to pursue **other paths towards a paper**:
   1. Conducting a literature review of a specific topic
   1. Writing a technical report for a complex engineering or systems building effort you undertook
   1. Meticulously reproducing a set of results from an existing paper (and describing that effort in detail)

## Paper

Your paper must be 3-6 pages in length of scientific content, plus an unlimited number of pages for broader impact statement, acknowledgements, references, and supplementary material (an appendix).

The **3 page minimum is just a guideline**. You are expected to include all sections all expected sections as appropriate for your paper (e.g., abstract, intro, related work, methods, experiments, discussion, conclusion, broader impacts, etc.). You can be penalized for an incomplete paper if your submission is 3 pages but missing vital sections.

The technical writing in your final paper submission is expected to be polished to publication-worthy standards.

### Template

You are required to prepare your paper using the ISMIR 2025 LaTeX template ([LaTeX and Word templates](https://github.com/ismir/paper_templates/tree/master/2025)). **I recommend using the [LaTeX template via Overleaf](https://www.overleaf.com/latex/templates/paper-template-for-ismir-2025/xnqdhjhdgsfd)**. You can receive [Overleaf Pro for free using your CMU affiliation](https://www.overleaf.com/edu/cmu).

### Draft sections

You will be required to submit drafts of specific sections of your paper by certain [dates](#key-dates). For all of these checkpoints:

1. You are required to use the [template](#template) above
1. Your drafts should be cumulative, i.e., your PDF submissions should include the latest material you have for all previously drafted sections.
1. The specific draft sections being reviewed do not need to be publication-ready, but the main content should be there and read cleanly from start to finish. Other draft sections in your submission PDF can be messy and work-in-progress.

The expected draft sections are as follows:

- **Related work**: A standard related work section summarizing the major past work on your research topic. Ideally, articulate why your proposed work differs relative to past work. Often the second or second-to-last section in a paper.
- **Activites sections**: The main "content" of your paper. Describe your research activities. E.g., for an ML project, describe your methods and outline your experiments. E.g., for a review paper, describe the manner in which you plan to gather corresponding literature, and which survey methods you will use. Where applicable, include placeholder results tables, though no need to fill in the results yet.
- **Preliminary results**: Make progress on your research activities and summarize your progress to date, e.g., by filling in more details in your activities section including concrete results
- **Intro, abstract, and figure 1**: Craft the high-level story of your paper through clear and punchy intro material. Illustrate what you've done at a glance with a compelling figure 1.

## Presentation

TBA

## Peer review

TBA

## Grading

The final project counts for 20% of your _total_ course grade. Relative grading proportions for the final project are as follows:

- (10%) Project proposal submitted by hard deadline w/ all required aspects
- (30%) All draft sections submitted w/ all required aspects and no more than 7 total grace days
- (40%) Final paper submitted by hard deadline w/ all required aspects
- (20%) Successful in class presentation (hard deadline)

Due to tight grading turnaround times, **missing a deadline for a component with a _hard_ deadline (project proposal, final paper, in class presentation) will result in a deduction of _at least_ half of the points associated with that component.**

Peer review for the final project counts for an additional 5% of your total course grade. Grading guidelines will be posted at a later time.
