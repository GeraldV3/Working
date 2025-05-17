// ICONS
import eyecross from "@assets/icons/eyecross.png";
import home from "@assets/icons/home.png";
import chat from "@assets/icons/chat.png";
import bot from "@assets/icons/robot.png";
import profile from "@assets/icons/profile.png";
import email from "@assets/icons/email.png";
import lock from "@assets/icons/lock.png";
import person from "@assets/icons/person.png";
import graph from "@assets/icons/line-chart.png";
import visible from "@assets/icons/visible.png";

// IMAGES
import check from "@assets/images/check.png";
import onboarding1 from "@assets/images/onboarding1.png";
import onboarding2 from "@assets/images/onboarding2.png";
import onboarding3 from "@assets/images/onboarding3.png";
import startBg from "@assets/images/start-bg.png";
import history from "@assets/images/history.png";
import face from "@assets/images/face.png";

// EMOTIONS
import angry_1 from "@assets/images/Emotions/angry-1.png";
import angry_2 from "@assets/images/Emotions/angry-2.png";
import angry_3 from "@assets/images/Emotions/angry-3.png";
import happy_1 from "@assets/images/Emotions/happy-1.png";
import happy_2 from "@assets/images/Emotions/happy-2.png";
import happy_3 from "@assets/images/Emotions/happy-3.png";
import neutral_1 from "@assets/images/Emotions/neutral-1.png";
import neutral_2 from "@assets/images/Emotions/neutral-2.png";
import neutral_3 from "@assets/images/Emotions/neutral-3.png";
import sad_1 from "@assets/images/Emotions/sad-1.png";
import sad_2 from "@assets/images/Emotions/sad-2.png";
import sad_3 from "@assets/images/Emotions/sad-3.png";
import surprised_1 from "@assets/images/Emotions/surprised-1.png";
import surprised_2 from "@assets/images/Emotions/surprised-2.png";
import surprised_3 from "@assets/images/Emotions/surprised-3.png";
import alert from "@assets/icons/alert.png";

// GROUPED EXPORTS
export const icons = {
  eyecross,
  home,
  chat,
  bot,
  profile,
  email,
  lock,
  person,
  graph,
  visible,
  alert,
};

export const images = {
  check,
  onboarding1,
  onboarding2,
  onboarding3,
  startBg,
  history,
  face,
};

export const emotions = {
  angry_1,
  angry_2,
  angry_3,
  happy_1,
  happy_2,
  happy_3,
  neutral_1,
  neutral_2,
  neutral_3,
  sad_1,
  sad_2,
  sad_3,
  surprised_1,
  surprised_2,
  surprised_3,
};
export const paragraphs = {
  aboutUs: `
    Project EYES (Utilizing Affective Computing Technology to Facilitate Social Communication in Children with Down Syndrome) aims to empower children with Down Syndrome through real-time emotional awareness technology. The project utilizes affective computing to analyze facial expressions and eye gaze, providing a discreet, affordable, and user-friendly device designed to enhance social interaction for children with disabilities.

    Focusing on the inclusive setting of General Tiburcio de Leon Elementary School in Valenzuela City, Philippines, the project integrates real-time emotional cues into the educational experience. This solution complements existing assistive technologies, helping children understand and respond to social cues more effectively, and empowering educators and caregivers with tools to support their emotional and social development.

    Project EYES is a step forward in bridging gaps where traditional methods fail to address the unique needs of children with Down Syndrome, providing them with better opportunities for emotional engagement and social communication.
  `,
  privacyPolicy: `
    At Project EYES, we are committed to protecting the privacy and security of your personal information. We collect and process user data solely for the purpose of enhancing the functionality of our emotional recognition technology. This includes storing basic user information (such as first and last names) to provide personalized support and features. We do not share, sell, or disclose your personal data to third parties without consent.

    Data collected through the use of our technology, such as facial expression and eye gaze data, is stored securely and only used to improve the effectiveness of our system. We ensure that all information is handled with the highest standard of security to protect the privacy of children and families involved in the project.

    By using Project EYES, you consent to the collection and processing of your data as outlined in this policy. For further details on how we protect your data and your rights, please contact us at project.eyes2025@gmail.com.
  `,
};

export const onboarding = [
  {
    id: 1,
    title: "Build connections with Project EYES!",
    description:
      "Supporting communication for your children through affective technology.",
    image: images.onboarding1,
  },
  {
    id: 2,
    title: "Get personalized insights!",
    description:
      "Our system analyzes your child's emotions to provide tailored support.",
    image: images.onboarding2,
  },
  {
    id: 3,
    title: "Your support, their growth. Let’s begin!",
    description:
      "Understand emotions, nurture bonds, and support your child’s journey.",
    image: images.onboarding3,
  },
];

export const data = {
  onboarding,
};
