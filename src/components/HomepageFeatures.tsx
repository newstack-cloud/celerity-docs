import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

type FeatureItem = {
  title: string;
  image: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Move Fast',
    image: '/img/undraw_to-the-stars.svg',
    description: (
      <>
        Celerity is designed to help you move fast with its comprehensive
        set of tools to shorten feedback loops and get you swiftly deploying
        software you can trust will work.
      </>
    ),
  },
  {
    title: 'Run Anywhere with Ease',
    image: '/img/undraw_cloud-hosting.svg',
    description: (
      <>
        Celerity lets you focus on the problems you are trying to solve,
        you can write your applications once and run them on any cloud provider
        as containerised or serverless applications.
      </>
    ),
  },
  {
    title: 'Useful Primitives',
    image: '/img/undraw_building-blocks.svg',
    description: (
      <>
        Build with a set of useful primitives focusing on common types of applications
        such as a REST API, WebSocket API or a Pub/Sub Consumer.
      </>
    ),
  },
];

function Feature({title, image, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img className={styles.featureSvg} alt={title} src={image} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
