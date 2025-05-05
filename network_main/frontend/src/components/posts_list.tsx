import React from 'react';
import Link from 'next/link';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  timeAgo: string;
  comments: number;
}

const mockPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Simplest Salad Recipe ever',
    description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    image: 'https://images.pexels.com/photos/61180/pexels-photo-61180.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    category: 'Cooking',
    timeAgo: '6 mins ago',
    comments: 39,
  },
  {
    id: 2,
    title: 'Best FastFood Ideas (Yummy)',
    description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    image: 'https://images.pexels.com/photos/1600727/pexels-photo-1600727.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    category: 'Cooking',
    timeAgo: '10 days ago',
    comments: 0,
  },
  {
    id: 3,
    title: 'Why to eat salad?',
    description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    image: 'https://images.pexels.com/photos/6086/food-salad-healthy-vegetables.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    category: 'Cooking',
    timeAgo: '16 hours ago',
    comments: 9,
  },
];

export default function PostList() {
  return (
    <div className="max-w-[850px] mx-auto p-5 sm:p-10 md:p-16">
      <div className="border-b mb-5 flex justify-between text-sm dark:border-[var(--border)]" />

      <div className="bg-white dark:bg-[var(--background)] hover:bg-[var(--hover-post-background)] transition rounded-2xl hover:shadow-2xl mx-auto w-full overflow-hidden">
      <div className="p-4">

        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <img className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                 src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80"
                 alt="User Avatar"/>
            <div className="text-sm min-w-0">
              <a href="#" className="font-semibold text-primary hover:underline hover:text-blue-700 dark:hover:text-blue-400">
                Community name
              </a>
              <p className="text-xs text-secondary flex items-center">
                • 1 days ago 
              </p>
            </div>
          </div>
          <button aria-label="More options" className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1.5 -mt-1 -mr-1.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path></svg>
          </button>
        </div>

        <div className="text-lg font-semibold text-primary mb-2 break-words">
            <p>Post title</p>
        </div>

        <div className="mb-3 rounded-2xl overflow-hidden border border-[var(--border)]">
             <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
                 alt="Post media content" className="w-full object-cover"/>
        </div>

        <div className="flex items-center gap-3">
          {/* Post rating buttons */}
          <div className="flex items-center gap-0.5 bg-gray-200/20 rounded-full py-0.5">
            <button
              className="btn btn-sm btn-secondary rounded-full border border-transparent p-1 hover:bg-gray-300/40"
              // data-content-type={post.content_type}
              // data-object-id={post.id}
              data-value="1"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                // data-content-type={post.content_type}
                // data-object-id={post.id}
                data-value="1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.781 2.375c-.381-.475-1.181-.475-1.562 0l-8 10A1.001 1.001 0 0 0 4 14h4v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7h4a1.001 1.001 0 0 0 .781-1.625l-8-10zM15 12h-1v8h-4v-8H6.081L12 4.601 17.919 12H15z" />
              </svg>
            </button>
            <span className="text mx-1">243.5k</span>
            <button
              className="btn btn-sm btn-secondary rounded-full border border-transparent p-1 hover:bg-gray-300/40"
              // data-content-type={post.content_type}
              // data-object-id={post.id}
              data-value="-1"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                // data-content-type={post.content_type}
                // data-object-id={post.id}
                data-value="-1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20.901 10.566A1.001 1.001 0 0 0 20 10h-4V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v7H4a1.001 1.001 0 0 0-.781 1.625l8 10a1 1 0 0 0 1.562 0l8-10c.24-.301.286-.712.12-1.059zM12 19.399 6.081 12H10V4h4v8h3.919L12 19.399z" />
              </svg>
            </button>
          </div>

          {/* Comment link */}
          <Link href='#' className="flex items-center gap-1 bg-gray-200/20 hover:bg-gray-200/40 rounded-full px-3 py-1.5">
            <svg width="18" height="18" viewBox="100 255 34 32" fill="currentColor">
              <path d="M116,281 C114.832,281 113.704,280.864 112.62,280.633 L107.912,283.463 L107.975,278.824 C104.366,276.654 102,273.066 102,269 C102,262.373 108.268,257 116,257 C123.732,257 130,262.373 130,269 C130,275.628 123.732,281 116,281 L116,281 Z M116,255 C107.164,255 100,261.269 100,269 C100,273.419 102.345,277.354 106,279.919 L106,287 L113.009,282.747 C113.979,282.907 114.977,283 116,283 C124.836,283 132,276.732 132,269 C132,261.269 124.836,255 116,255 L116,255 Z" />
            </svg>
            <span className="text-sm">432</span>
          </Link>

          {/* Share link */}
          <Link href="#" className="flex items-center gap-1 bg-gray-200/20 hover:bg-gray-200/40 rounded-full px-3 py-1.5">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
              <path d="M14.734 15.8974L19.22 12.1374C19.3971 11.9927 19.4998 11.7761 19.4998 11.5474C19.4998 11.3187 19.3971 11.1022 19.22 10.9574L14.734 7.19743C14.4947 6.9929 14.1598 6.94275 13.8711 7.06826C13.5824 7.19377 13.3906 7.47295 13.377 7.78743V9.27043C7.079 8.17943 5.5 13.8154 5.5 16.9974C6.961 14.5734 10.747 10.1794 13.377 13.8154V15.3024C13.3888 15.6178 13.5799 15.8987 13.8689 16.0254C14.158 16.1521 14.494 16.1024 14.734 15.8974Z" />
            </svg>
            <span className="text-sm">Share</span>
          </Link>
        </div>

      </div>
      
    </div>
    <hr className='border-[var(--border)] mt-2' />





    <div className="max-w-[880px] mx-auto p-5 sm:p-10 md:p-16">
      <div className="border-b mb-5 flex justify-between text-sm dark:border-[var(--border)]" />

      <div className="flex flex-col gap-2">
        {mockPosts.map((post) => (
          <div key={post.id}>
            <div className="rounded-2xl overflow-hidden shadow-lg flex flex-col">
              <a href="#"></a>
              <div className="px-6 py-4 mb-auto bg-transparent">
                <a
                  href="#"
                  className="font-medium text-gray-500 text-lg inline-block hover:text-black transition duration-500 ease-in-out inline-block mb-2"
                >
                  {post.title}
                </a>
                <p className="text-gray-500 text-sm">{post.description}</p>
              </div>
              <div className="relative rounded-2xl">
                <a href="#">
                  <img
                    className="w-full"
                    src={post.image}
                    alt={post.title}
                  />
                  <div className="hover:bg-transparent transition duration-300 absolute bottom-0 top-0 right-0 left-0 bg-gray-900 opacity-25"></div>
                </a>
              </div>
              
              <div className="px-6 py-3 flex flex-row items-center justify-between bg-transparent">
                <span
                  className="py-1 text-xs font-regular text-white mr-1 flex flex-row items-center"
                >
                  <svg
                    height="13px"
                    width="13px"
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 512 512"
                    enableBackground="new 0 0 455.005 455.005"
                    xmlSpace="preserve"
                  >
                    <g>
                      <g>
                        <path
                          d="M256,0C114.837,0,0,114.837,0,256s114.837,256,256,256s256-114.837,256-256S397.163,0,256,0z M277.333,256 c0,11.797-9.536,21.333-21.333,21.333h-85.333c-11.797,0-21.333-9.536-21.333-21.333s9.536-21.333,21.333-21.333h64v-128 c0-11.797,9.536-21.333,21.333-21.333s21.333,9.536,21.333,21.333V256z"
                        />
                      </g>
                    </g>
                  </svg>
                  <span className="ml-1">{post.timeAgo}</span>
                </span>
                <span
                  className="py-1 text-xs font-regular text-white mr-1 flex flex-row items-center"
                >
                  <svg
                    className="h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <span className="ml-1">{post.comments} Comments</span>
                </span>
              </div>
              
            </div>
          <hr className='mt-4' />
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};
