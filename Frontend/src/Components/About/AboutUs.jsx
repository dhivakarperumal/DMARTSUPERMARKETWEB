import React from "react";
import {
  ShoppingBasket,
  Truck,
  ShieldCheck,
  Leaf,
  Users,
  Award,
} from "lucide-react";
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "../CommenComponents/PageContainer";

const AboutUs = () => {
  return (
    <div className="bg-gray-50">

      {/* Banner */}
      <PageHeader
        title="About Us"
        subtitle="Fresh Groceries • Best Quality • Fast Delivery"
      />

      {/* About Section */}
      <PageContainer>

        <div className="py-20 grid lg:grid-cols-2 gap-14 items-center">

          {/* Image */}

          <div className="relative">
            <img
              src="/aboutimagesupermarket.png"
              alt=""
              className="rounded-3xl shadow-2xl w-full h-[500px] object-cover"
            />

            <div className="absolute -bottom-6 -right-6 bg-[#0e6827] text-white p-8 rounded-2xl shadow-xl">
              <h2 className="text-4xl font-bold">10+</h2>
              <p className="text-green-100">
                Years Experience
              </p>
            </div>
          </div>

          {/* Content */}

          <div>

            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
              ABOUT OUR STORE
            </span>

            <h2 className="mt-6 text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
              Fresh Grocery Delivered
              <span className="text-[#0e6827]"> To Your Doorstep</span>
            </h2>

            <p className="mt-6 text-gray-600 leading-8">
              We are committed to providing premium quality groceries,
              vegetables, fruits, dairy products, household essentials and
              daily needs at affordable prices. Our mission is to make grocery
              shopping simple, fast and enjoyable with reliable doorstep
              delivery.
            </p>

            <div className="grid sm:grid-cols-2 gap-5 mt-10">

              <div className="flex gap-4">
                <Leaf className="text-[#0e6827]" size={35}/>
                <div>
                  <h4 className="font-bold text-lg">
                    Fresh Products
                  </h4>
                  <p className="text-gray-500 text-sm">
                    Directly sourced from trusted farms.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Truck className="text-[#0e6827]" size={35}/>
                <div>
                  <h4 className="font-bold text-lg">
                    Fast Delivery
                  </h4>
                  <p className="text-gray-500 text-sm">
                    Safe & quick delivery to your location.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <ShieldCheck className="text-[#0e6827]" size={35}/>
                <div>
                  <h4 className="font-bold text-lg">
                    Secure Shopping
                  </h4>
                  <p className="text-gray-500 text-sm">
                    100% secure payments and checkout.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <ShoppingBasket className="text-[#0e6827]" size={35}/>
                <div>
                  <h4 className="font-bold text-lg">
                    Huge Collection
                  </h4>
                  <p className="text-gray-500 text-sm">
                    Thousands of quality grocery products.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </PageContainer>

      {/* Stats */}

      <section className="bg-[#0e6827] py-16">

        <PageContainer>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">

            <div>
              <h2 className="text-5xl font-bold">20K+</h2>
              <p className="mt-3 text-green-100">
                Happy Customers
              </p>
            </div>

            <div>
              <h2 className="text-5xl font-bold">500+</h2>
              <p className="mt-3 text-green-100">
                Products
              </p>
            </div>

            <div>
              <h2 className="text-5xl font-bold">50+</h2>
              <p className="mt-3 text-green-100">
                Trusted Brands
              </p>
            </div>

            <div>
              <h2 className="text-5xl font-bold">24/7</h2>
              <p className="mt-3 text-green-100">
                Customer Support
              </p>
            </div>

          </div>

        </PageContainer>

      </section>

      {/* Why Choose Us */}

      <PageContainer>

        <section className="py-20">

          <div className="text-center">

            <h2 className="text-4xl font-bold text-gray-800">
              Why Choose Us
            </h2>

            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
              We always focus on quality, freshness and customer satisfaction.
            </p>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-14">

            {[
              {
                icon: <Leaf size={42}/>,
                title:"Fresh Products",
                desc:"Daily fresh vegetables, fruits and groceries."
              },
              {
                icon:<Truck size={42}/>,
                title:"Quick Delivery",
                desc:"Same day delivery available."
              },
              {
                icon:<Users size={42}/>,
                title:"Customer First",
                desc:"We value every customer."
              },
              {
                icon:<Award size={42}/>,
                title:"Premium Quality",
                desc:"Best quality products guaranteed."
              },
              {
                icon:<ShieldCheck size={42}/>,
                title:"Safe Payments",
                desc:"Secure payment gateway."
              },
              {
                icon:<ShoppingBasket size={42}/>,
                title:"Affordable Price",
                desc:"Best prices every day."
              }
            ].map((item,index)=>(

              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition duration-300 border border-green-100"
              >

                <div className="w-20 h-20 rounded-full bg-green-100 text-[#0e6827] flex items-center justify-center mb-6">
                  {item.icon}
                </div>

                <h3 className="text-2xl font-bold text-gray-800">
                  {item.title}
                </h3>

                <p className="text-gray-500 mt-4 leading-7">
                  {item.desc}
                </p>

              </div>

            ))}

          </div>

        </section>

      </PageContainer>

      {/* Mission */}

      <section className="py-20 bg-gradient-to-r from-green-50 to-yellow-50">

        <PageContainer>

          <div className="grid lg:grid-cols-2 gap-10">

            <div className="bg-white rounded-3xl p-10 shadow-xl">
              <h3 className="text-3xl font-bold text-[#0e6827]">
                Our Mission
              </h3>

              <p className="mt-5 text-gray-600 leading-8">
                To deliver fresh groceries and daily essentials with exceptional
                quality, affordable pricing, and outstanding customer service.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl">
              <h3 className="text-3xl font-bold text-[#0e6827]">
                Our Vision
              </h3>

              <p className="mt-5 text-gray-600 leading-8">
                To become the most trusted supermarket by offering the best
                shopping experience through innovation and customer care.
              </p>
            </div>

          </div>

        </PageContainer>

      </section>

    </div>
  );
};

export default AboutUs;