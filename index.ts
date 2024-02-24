 import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as docker from "@pulumi/docker";
import * as time from "@pulumiverse/time"

// Grab some values from the Pulumi configuration (or use default values)
const config = new pulumi.Config();
const vpcNetworkCidr = config.get("vpcNetworkCidr") || "10.0.0.0/16";
const instanceType = config.get("instanceType") || "t3.micro";
const keypair = config.require("keypair")

// Create a new VPC
const demoVpc = new awsx.ec2.Vpc("demo-vpc", {
    enableDnsHostnames: true,
    cidrBlock: vpcNetworkCidr,
    natGateways: {
        strategy: "Single",
    },
});

// Get the AMI ID for an Ubuntu instance
const demoAmi = aws.ec2.getAmi({
    filters: [
        { name: "name", values: ["Flatcar-stable-*"]},
        { name: "architecture", values: ["x86_64"]},
    ],
    owners: ["075585003325"],
    mostRecent: true,
}).then(invoke => invoke.id);

// Create a security group allowing inbound SSH access
const demoSg = new aws.ec2.SecurityGroup("demo-sg", {
    description: "Enable SSH access",
    vpcId: demoVpc.vpcId,
    ingress: [{
        fromPort: 22,
        toPort: 22,
        protocol: "tcp",
        cidrBlocks: ["0.0.0.0/0"],
    }],
    egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
    }],
});

// Create and launch an EC2 instance into the public subnet
const demoBastion = new aws.ec2.Instance("demo-bastion", {
    ami: demoAmi,
    keyName: keypair,
    instanceType: instanceType,
    subnetId: demoVpc.publicSubnetIds[0],
    tags: {
        Name: "demo-bastion",
    },
    vpcSecurityGroupIds: [demoSg.id],
});

// Wait for the instance to boot
const bootDelay = new time.Sleep("boot-delay", {
    createDuration: "30s",
}, {dependsOn: [demoBastion]})

// Create a Docker provider pointing to the EC2 instance
const connString = demoBastion.publicIp.apply(publicIp => "ssh://core@" + publicIp)
const remoteDocker = new docker.Provider("remoteDocker", {
    host: connString,
    sshOpts: [
        "-i", "~/.ssh/pulumi_aws_rsa",
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null"
    ],
}, {dependsOn: [bootDelay]});

// Pull down container images
const nginxImage = new docker.RemoteImage("nginx-image", {
    name: "nginx:1.17.4-alpine",
}, { provider: remoteDocker });

// Run containers remotely
const nginxContainer = new docker.Container("nginx-container", {
    image: nginxImage.imageId,
}, { provider: remoteDocker });

// Export the instance IP address
export const instancePubIp = demoBastion.publicIp;
