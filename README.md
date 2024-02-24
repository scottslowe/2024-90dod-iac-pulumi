# 2024 90DaysOfDevOps Session: Infrastructure as Code with Pulumi

This repository is a companion to the 2024 90DaysOfDevOps session titled "Infrastructure as Code with Pulumi". It contains some sample code that is used during the session recording.

To use the code in this repository, you will need the following:

* The AWS CLI installed and configured for an AWS account (Pulumi doesn't rely on the AWS CLI, but it uses the configuration for connecting to AWS)
* The `pulumi` CLI tool installed and logged into a backend (see the slides for more information on Pulumi backends)
* NodeJS installed
* The `git` CLI tool installed

Follow these instructions to run this Pulumi program:

1. Use `git clone` to clone this repository to your local system.
2. Change into the directory where this repository was cloned.
3. Use `pulumi stack init <name>` to create a new Pulumi stack named `<name>`.
4. Run `pulumi config set aws:region <region>` to specify the AWS region where the resources should be created.
5. Run `pulumi config set keypair <keypair-name>` to specify the name of an existing AWS key pair that can be used for SSH access to an EC2 instance.
6. _(Optional)_ Set the desired VPC CIDR block with `pulumi config set vpcNetworkCidr <cidr>`.
7. _(Optional)_ Set the instance type with `pulumi config set <instance-type>`.
8. Run `pulumi up` to instantiate the infrastructure.
9. After the stack has finished provisioning, run `pulumi stack output` to get the IP address of the Flatcar Container Linux instance that was created.
10. When you're finished, run `pulumi destroy` to tear down all the AWS resources.

Enjoy!
