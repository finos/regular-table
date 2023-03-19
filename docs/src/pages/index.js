import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import React, { useEffect } from "react";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";

import styles from "./index.module.css";

function HomepageHeader() {
    const Svg = require("@site/static/img/regular-table-logo.svg").default;
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx("hero hero--primary", styles.heroBanner)}>
            <div className="container">
                <h1 className="hero__title">{siteConfig.title}</h1>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                <Svg role="img" />
            </div>
        </header>
    );
}

export default function Home() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout title={` ${siteConfig.title}`}>
            <HomepageHeader />
            <main>
                <Gallery />
            </main>
        </Layout>
    );
}

function ExampleTable({ data }) {
    return (
        <div
            style={{
                display: "flex",
                margin: "0 auto",
                flexWrap: "wrap",
                justifyContent: "center",
            }}
        >
            {data.map(({ img, url, name }, i) => {
                return (
                    <Link
                        to={url}
                        style={{ width: "400px", padding: "0 12px" }}
                    >
                        <br />
                        <h4>{name}</h4>
                        <img
                            width="100%"
                            src={img}
                            style={{
                                borderRadius: "10px",
                                border: "1px solid var(--ifm-toc-border-color)",
                            }}
                        ></img>
                    </Link>
                );
            })}
        </div>
    );
}

function Gallery() {
    const { siteConfig } = useDocusaurusContext();

    if (ExecutionEnvironment.canUseDOM) {
        useEffect(() => {
            document.body.classList.add("scrolled");
        }, []);
    }

    return (
        <>
            <br />
            <ExampleTable data={siteConfig.customFields.examples} />
            <ExampleTable data={siteConfig.customFields.features} />
            <br />
            <br />
        </>
    );
}
